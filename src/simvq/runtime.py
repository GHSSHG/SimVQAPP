from __future__ import annotations

import importlib
import json
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np

from .errors import DependencyError, RuntimeNotReadyError
from .types import CachedModel


REAL_JAX_MODES = {"jax_external_repo", "jax_orbax_external_repo", "real_jax"}
EXTERNAL_REPO_OVERRIDE_ENV_VARS = ("SIMVQ_MODEL_SOURCE_REPO", "SIMVQ_SOURCE_REPO_PATH")


def _load_runtime_config(model: CachedModel) -> dict[str, Any]:
    return json.loads(model.config_path.read_text(encoding="utf-8"))


def _repo_has_model_builder(candidate: Path) -> bool:
    resolved = candidate.expanduser().resolve()
    return (resolved / "codec" / "models.py").exists() or (resolved / "codec" / "models" / "__init__.py").exists()


def _candidate_repo_paths(config: dict[str, Any]) -> list[tuple[str, Path]]:
    candidates: list[tuple[str, Path]] = []
    seen: set[str] = set()

    def add(label: str, raw_value: Any) -> None:
        text = str(raw_value or "").strip()
        if not text:
            return
        resolved = Path(text).expanduser().resolve()
        key = str(resolved)
        if key in seen:
            return
        seen.add(key)
        candidates.append((label, resolved))

    add("configured", config.get("source_repo_path"))
    for env_name in EXTERNAL_REPO_OVERRIDE_ENV_VARS:
        add(f"env:{env_name}", os.environ.get(env_name))

    source_config_json = str(config.get("source_config_json") or "").strip()
    if source_config_json:
        config_path = Path(source_config_json).expanduser().resolve()
        search_roots = [config_path, *config_path.parents]
        for index, parent in enumerate(search_roots):
            add(f"source_config_parent:{index}", parent)

    add("cwd", Path.cwd())
    return candidates


def resolve_external_repo_path(config: dict[str, Any]) -> tuple[Path | None, str | None]:
    for label, candidate in _candidate_repo_paths(config):
        if candidate.exists() and _repo_has_model_builder(candidate):
            return candidate, label
    return None, None


def runtime_health(model: CachedModel) -> dict[str, Any]:
    config = _load_runtime_config(model)
    mode = str(config.get("mode", model.mode))
    checkpoint_exists = bool(model.checkpoint_path and model.checkpoint_path.exists())
    configured_source_repo = str(config.get("source_repo_path") or "").strip()
    resolved_source_repo, resolved_from = resolve_external_repo_path(config)
    issues: list[str] = []

    if not checkpoint_exists:
        issues.append("Checkpoint path is missing.")

    if mode in REAL_JAX_MODES:
        if resolved_source_repo is None:
            if configured_source_repo:
                configured_path = Path(configured_source_repo).expanduser().resolve()
                if not configured_path.exists():
                    issues.append(f"Configured source repo does not exist: {configured_path}")
                elif not _repo_has_model_builder(configured_path):
                    issues.append(f"Configured source repo is missing codec.models: {configured_path}")
            env_hints = ", ".join(EXTERNAL_REPO_OVERRIDE_ENV_VARS)
            issues.append(
                "A compatible SimVQGAN source repo is required for this model. "
                f"Set one in the desktop settings or via {env_hints}."
            )

    return {
        "mode": mode,
        "ready": checkpoint_exists and (mode not in REAL_JAX_MODES or resolved_source_repo is not None),
        "checkpoint_exists": checkpoint_exists,
        "configured_source_repo_path": configured_source_repo or None,
        "resolved_source_repo_path": (None if resolved_source_repo is None else str(resolved_source_repo)),
        "resolved_source_repo_from": resolved_from,
        "issues": issues,
    }


def _pop_conflicting_codec_modules(repo_root: Path) -> None:
    for module_name, module in list(sys.modules.items()):
        if module_name != "codec" and not module_name.startswith("codec."):
            continue
        module_file = getattr(module, "__file__", None)
        if not module_file:
            continue
        try:
            module_path = Path(module_file).resolve()
        except Exception:
            continue
        if module_path.is_relative_to(repo_root):
            continue
        sys.modules.pop(module_name, None)


def _load_external_builder(repo_root: Path):
    resolved_repo = repo_root.expanduser().resolve()
    if not resolved_repo.exists():
        raise RuntimeNotReadyError(f"Model source repo does not exist: {resolved_repo}")
    _pop_conflicting_codec_modules(resolved_repo)
    if str(resolved_repo) not in sys.path:
        sys.path.insert(0, str(resolved_repo))
    importlib.invalidate_caches()
    try:
        module = importlib.import_module("codec.models")
    except Exception as exc:
        raise DependencyError(f"Failed to import model builder from {resolved_repo}: {exc}") from exc
    build_audio_model = getattr(module, "build_audio_model", None)
    if build_audio_model is None:
        raise RuntimeNotReadyError(f"codec.models.build_audio_model not found under {resolved_repo}")
    return build_audio_model


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


class _JaxExternalRepoBackend:
    def __init__(self, *, config: dict[str, Any], checkpoint_path: Path | None, device: str = "auto"):
        if checkpoint_path is None:
            raise RuntimeNotReadyError("Real JAX runtime requires a local checkpoint path.")
        if not checkpoint_path.exists():
            raise RuntimeNotReadyError(f"Checkpoint path does not exist: {checkpoint_path}")

        model_cfg = dict(config.get("model_config") or config.get("model") or {})
        source_repo_path = config.get("source_repo_path")
        resolved_source_repo, _resolved_from = resolve_external_repo_path(config)
        if resolved_source_repo is None:
            configured = str(source_repo_path or "").strip()
            if configured:
                raise RuntimeNotReadyError(
                    f"Model source repo does not exist: {Path(configured).expanduser().resolve()}"
                )
            env_hints = ", ".join(EXTERNAL_REPO_OVERRIDE_ENV_VARS)
            raise RuntimeNotReadyError(
                "Real JAX runtime requires a compatible SimVQGAN source repo. "
                f"Provide source_repo_path in the cached model or set {env_hints}."
            )

        build_audio_model = _load_external_builder(resolved_source_repo)
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
            backend = _JaxExternalRepoBackend(
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
        "chunk_size": int(config.get("chunk_size", 12288)),
        "tokens_per_chunk": int(config.get("tokens_per_chunk", 4096)),
        "codebook_size": int(config.get("codebook_size", 65536)),
        "source_repo_path": health["resolved_source_repo_path"] or health["configured_source_repo_path"],
        "configured_source_repo_path": health["configured_source_repo_path"],
        "resolved_source_repo_path": health["resolved_source_repo_path"],
        "resolved_source_repo_from": health["resolved_source_repo_from"],
        "checkpoint_exists": health["checkpoint_exists"],
        "ready": health["ready"],
        "issues": health["issues"],
    }
