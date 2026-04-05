from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np

from .errors import DependencyError, RuntimeNotReadyError
from .types import CachedModel


REAL_JAX_MODES = {"jax_builtin", "jax_external_repo", "jax_orbax_external_repo", "real_jax"}


def _load_runtime_config(model: CachedModel) -> dict[str, Any]:
    return json.loads(model.config_path.read_text(encoding="utf-8"))


def _load_builtin_builder():
    try:
        from ._simvqgan import build_audio_model

        return build_audio_model
    except Exception as exc:  # pragma: no cover - import guard
        raise DependencyError(f"Failed to load built-in SimVQ model builder: {exc}") from exc


def runtime_health(model: CachedModel) -> dict[str, Any]:
    config = _load_runtime_config(model)
    mode = str(config.get("mode", model.mode))
    checkpoint_exists = bool(model.checkpoint_path and model.checkpoint_path.exists())
    issues: list[str] = []

    if not checkpoint_exists:
        issues.append("Checkpoint path is missing.")

    return {
        "mode": mode,
        "backend": ("builtin" if mode in REAL_JAX_MODES else "stub"),
        "ready": checkpoint_exists,
        "checkpoint_exists": checkpoint_exists,
        "issues": issues,
    }


def _resolve_device(jax_module, device: str):
    wanted = str(device or "auto").strip().lower()
    if wanted == "auto":
        for platform in ("gpu", "tpu", "cpu"):
            try:
                devices = jax_module.devices(platform)
            except Exception:
                devices = []
            if devices:
                return devices[0]
        devices = jax_module.devices()
        if not devices:
            raise RuntimeNotReadyError("No JAX devices are available.")
        return devices[0]

    try:
        devices = jax_module.devices(wanted)
    except Exception:
        devices = []
    if devices:
        return devices[0]
    for candidate in jax_module.devices():
        if candidate.platform == wanted or str(candidate).lower() == wanted:
            return candidate
    raise RuntimeNotReadyError(f"Requested JAX device is not available: {device}")


def _extract_generator_variables(restored: Any) -> tuple[dict[str, Any], int | None]:
    if not isinstance(restored, dict) or "gen" not in restored:
        raise RuntimeNotReadyError("Unexpected checkpoint structure: missing top-level 'gen'.")
    gen_state = restored["gen"]
    step = None
    params = None
    vq_vars = None

    if isinstance(gen_state, dict):
        params = gen_state.get("params")
        vq_vars = gen_state.get("vq_vars") or gen_state.get("vq")
        step = gen_state.get("step")
    else:
        params = getattr(gen_state, "params", None)
        vq_vars = getattr(gen_state, "vq_vars", None) or getattr(gen_state, "vq", None)
        step = getattr(gen_state, "step", None)

    if params is None:
        raise RuntimeNotReadyError("Checkpoint is missing generator params.")
    variables = {
        "params": params,
        "vq": vq_vars or {},
    }
    return variables, (None if step is None else int(step))


def _restore_orbax_checkpoint(checkpoint_path: Path, *, device: str):
    try:
        import jax
        import orbax.checkpoint as ocp
    except Exception as exc:
        raise DependencyError(f"JAX/Orbax runtime dependencies are required: {exc}") from exc

    resolved_device = _resolve_device(jax, device)
    fallback_sharding = jax.sharding.SingleDeviceSharding(resolved_device)
    checkpointer = ocp.Checkpointer(ocp.PyTreeCheckpointHandler())
    metadata = checkpointer.metadata(checkpoint_path)
    metadata_tree = metadata.item_metadata.tree

    def _leaf_sharding(leaf):
        sharding_meta = getattr(leaf, "sharding", None)
        if sharding_meta is None:
            return None
        try:
            return sharding_meta.to_jax_sharding()
        except Exception:
            return fallback_sharding

    sharding_tree = jax.tree_util.tree_map(_leaf_sharding, metadata_tree)
    restore_args = ocp.checkpoint_utils.construct_restore_args(metadata_tree, sharding_tree)
    restored = checkpointer.restore(
        checkpoint_path,
        args=ocp.args.PyTreeRestore(item=None, restore_args=restore_args),
    )
    return jax, restored, resolved_device


class _StubBackend:
    def __init__(self, *, chunk_size: int, tokens_per_chunk: int, codebook_size: int):
        self.chunk_size = int(chunk_size)
        self.tokens_per_chunk = int(tokens_per_chunk)
        self.codebook_size = int(codebook_size)
        if self.chunk_size <= 0 or self.tokens_per_chunk <= 0:
            raise RuntimeNotReadyError("Invalid runtime configuration.")
        if self.chunk_size % self.tokens_per_chunk != 0:
            raise RuntimeNotReadyError("Stub runtime requires chunk_size to be divisible by tokens_per_chunk.")
        self._group_size = self.chunk_size // self.tokens_per_chunk

    def encode_normalized_chunks(self, chunks: np.ndarray, batch_size: int) -> np.ndarray:
        del batch_size
        arr = np.asarray(chunks, dtype=np.float32)
        if arr.ndim != 2 or arr.shape[1] != self.chunk_size:
            raise RuntimeNotReadyError(
                f"Expected chunk batch with shape [N, {self.chunk_size}], got {arr.shape}."
            )
        grouped = arr.reshape(arr.shape[0], self.tokens_per_chunk, self._group_size)
        pooled = np.mean(grouped, axis=2)
        scaled = np.rint(((pooled + 1.0) * 0.5) * float(self.codebook_size - 1))
        return np.clip(scaled, 0, self.codebook_size - 1).astype(np.uint16)

    def decode_token_chunks(self, token_ids: np.ndarray, batch_size: int) -> np.ndarray:
        del batch_size
        arr = np.asarray(token_ids)
        if arr.ndim != 2 or arr.shape[1] != self.tokens_per_chunk:
            raise RuntimeNotReadyError(
                f"Expected token batch with shape [N, {self.tokens_per_chunk}], got {arr.shape}."
            )
        normalized = (arr.astype(np.float32) / float(self.codebook_size - 1)) * 2.0 - 1.0
        expanded = np.repeat(normalized, self._group_size, axis=1)
        return expanded[:, : self.chunk_size].astype(np.float32)


class _BuiltinJaxBackend:
    def __init__(self, *, config: dict[str, Any], checkpoint_path: Path | None, device: str = "auto"):
        if checkpoint_path is None:
            raise RuntimeNotReadyError("Real JAX runtime requires a local checkpoint path.")
        if not checkpoint_path.exists():
            raise RuntimeNotReadyError(f"Checkpoint path does not exist: {checkpoint_path}")

        model_cfg = dict(config.get("model_config") or config.get("model") or {})
        build_audio_model = _load_builtin_builder()
        jax, restored, resolved_device = _restore_orbax_checkpoint(checkpoint_path.expanduser().resolve(), device=device)
        variables, checkpoint_step = _extract_generator_variables(restored)

        self.chunk_size = int(config.get("chunk_size", 12288))
        self.tokens_per_chunk = int(config.get("tokens_per_chunk", 4096))
        self.codebook_size = int(config.get("codebook_size", model_cfg.get("codebook_size", 65536)))
        self.checkpoint_step = checkpoint_step
        self.device_platform = str(resolved_device.platform)

        if self.chunk_size <= 0 or self.tokens_per_chunk <= 0:
            raise RuntimeNotReadyError("Invalid runtime configuration.")
        if self.chunk_size % self.tokens_per_chunk != 0:
            raise RuntimeNotReadyError("chunk_size must be divisible by tokens_per_chunk.")

        if self.device_platform not in {"gpu"} and str(model_cfg.get("transformer_attention_backend", "")).lower() == "jax_cudnn":
            model_cfg["transformer_attention_backend"] = "flax"
        model_cfg.setdefault("variant", str(config.get("variant", "v45")))

        self._jax = jax
        self._device = resolved_device
        self._variables = variables
        self._apply_rng = jax.random.PRNGKey(int(config.get("seed", 0)))
        self._model = build_audio_model(model_cfg)
        self._encode_fn, self._decode_fn = self._build_inference_functions()

    def _build_inference_functions(self):
        jax = self._jax
        jnp = jax.numpy
        model = self._model
        variables = self._variables
        apply_rng = self._apply_rng

        try:
            codebook = variables["vq"]["quantizer"]["codebook"]
            proj_weight = variables["params"]["quantizer"]["W"]
            proj_bias = variables["params"]["quantizer"]["proj_bias"]
        except Exception as exc:
            raise RuntimeNotReadyError(f"Checkpoint is missing quantizer variables: {exc}") from exc

        projected_codebook = (
            jnp.asarray(codebook, dtype=jnp.float32) @ jnp.asarray(proj_weight, dtype=jnp.float32)
        ) + jnp.asarray(proj_bias, dtype=jnp.float32)
        projected_codebook = jax.device_put(projected_codebook, self._device)
        if int(projected_codebook.shape[0]) != self.codebook_size:
            raise RuntimeNotReadyError(
                f"Configured codebook_size={self.codebook_size} does not match checkpoint shape {projected_codebook.shape}."
            )

        def _encode(batch):
            outputs = model.apply(
                variables,
                batch,
                train=False,
                offset=0,
                rng=apply_rng,
                collect_codebook_stats=False,
            )
            return outputs["enc"]["indices"]

        def _decode(token_ids):
            z_q = jnp.take(projected_codebook, token_ids.astype(jnp.int32), axis=0)
            wave_hat, _ = model.apply(
                variables,
                z_q,
                method=model.decode,
                train=False,
                rng=apply_rng,
            )
            return wave_hat

        return jax.jit(_encode), jax.jit(_decode)

    def encode_normalized_chunks(self, chunks: np.ndarray, batch_size: int) -> np.ndarray:
        arr = np.asarray(chunks, dtype=np.float32)
        if arr.ndim != 2 or arr.shape[1] != self.chunk_size:
            raise RuntimeNotReadyError(
                f"Expected chunk batch with shape [N, {self.chunk_size}], got {arr.shape}."
            )
        if arr.shape[0] == 0:
            return np.zeros((0, self.tokens_per_chunk), dtype=np.int32)

        outputs: list[np.ndarray] = []
        step = max(1, int(batch_size))
        for start in range(0, arr.shape[0], step):
            batch = self._jax.device_put(arr[start : start + step], self._device)
            indices = self._encode_fn(batch)
            outputs.append(np.asarray(self._jax.device_get(indices), dtype=np.int32))
        result = np.concatenate(outputs, axis=0)
        if result.shape[1] != self.tokens_per_chunk:
            raise RuntimeNotReadyError(
                f"Model emitted {result.shape[1]} tokens per chunk, expected {self.tokens_per_chunk}."
            )
        return result

    def decode_token_chunks(self, token_ids: np.ndarray, batch_size: int) -> np.ndarray:
        arr = np.asarray(token_ids, dtype=np.int32)
        if arr.ndim != 2 or arr.shape[1] != self.tokens_per_chunk:
            raise RuntimeNotReadyError(
                f"Expected token batch with shape [N, {self.tokens_per_chunk}], got {arr.shape}."
            )
        if arr.shape[0] == 0:
            return np.zeros((0, self.chunk_size), dtype=np.float32)

        outputs: list[np.ndarray] = []
        step = max(1, int(batch_size))
        for start in range(0, arr.shape[0], step):
            batch = self._jax.device_put(arr[start : start + step], self._device)
            decoded = self._decode_fn(batch)
            outputs.append(np.asarray(self._jax.device_get(decoded), dtype=np.float32))
        result = np.concatenate(outputs, axis=0)
        if result.shape[1] != self.chunk_size:
            raise RuntimeNotReadyError(
                f"Model decoded chunk width {result.shape[1]}, expected {self.chunk_size}."
            )
        return result


class ModelRuntime:
    def __init__(
        self,
        *,
        model_name: str,
        model_version: str,
        mode: str,
        chunk_size: int,
        tokens_per_chunk: int,
        codebook_size: int,
        backend: Any,
    ):
        self.model_name = model_name
        self.model_version = model_version
        self.mode = mode
        self._chunk_size = int(chunk_size)
        self._tokens_per_chunk = int(tokens_per_chunk)
        self._codebook_size = int(codebook_size)
        self._backend = backend

    @classmethod
    def from_cached_model(cls, model: CachedModel, device: str = "auto") -> "ModelRuntime":
        config = _load_runtime_config(model)
        mode = str(config.get("mode", model.mode))
        if mode == "stub_random":
            backend = _StubBackend(
                chunk_size=int(config.get("chunk_size", 12288)),
                tokens_per_chunk=int(config.get("tokens_per_chunk", 4096)),
                codebook_size=int(config.get("codebook_size", 65536)),
            )
        elif mode in REAL_JAX_MODES:
            backend = _BuiltinJaxBackend(
                config=config,
                checkpoint_path=model.checkpoint_path,
                device=device,
            )
        else:
            raise RuntimeNotReadyError(f"Unsupported runtime mode for {model.name}: {mode}")
        return cls(
            model_name=model.name,
            model_version=model.version,
            mode=mode,
            chunk_size=backend.chunk_size,
            tokens_per_chunk=backend.tokens_per_chunk,
            codebook_size=backend.codebook_size,
            backend=backend,
        )

    @property
    def chunk_size(self) -> int:
        return self._chunk_size

    @property
    def tokens_per_chunk(self) -> int:
        return self._tokens_per_chunk

    @property
    def codebook_size(self) -> int:
        return self._codebook_size

    def encode_normalized_chunks(self, chunks: np.ndarray, batch_size: int) -> np.ndarray:
        return self._backend.encode_normalized_chunks(chunks, batch_size=batch_size)

    def decode_token_chunks(self, token_ids: np.ndarray, batch_size: int) -> np.ndarray:
        return self._backend.decode_token_chunks(token_ids, batch_size=batch_size)


def runtime_summary(model: CachedModel) -> dict[str, object]:
    config = _load_runtime_config(model)
    health = runtime_health(model)
    return {
        "model_name": model.name,
        "model_version": model.version,
        "mode": str(config.get("mode", model.mode)),
        "backend": health["backend"],
        "chunk_size": int(config.get("chunk_size", 12288)),
        "tokens_per_chunk": int(config.get("tokens_per_chunk", 4096)),
        "codebook_size": int(config.get("codebook_size", 65536)),
        "checkpoint_exists": health["checkpoint_exists"],
        "ready": health["ready"],
        "issues": health["issues"],
    }
