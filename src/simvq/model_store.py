from __future__ import annotations

import hashlib
import json
import re
import shutil
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlopen

from .errors import ModelCatalogError, ModelStoreError
from .types import CachedModel, RemoteModelSpec

DEFAULT_CATALOG = {
    "catalog_version": "simvq.models/v1",
    "models": [
        {
            "name": "simvq-v45-stub",
            "version": "0.0.1",
            "variant": "v45",
            "mode": "stub_random",
            "config_url": None,
            "checkpoint_url": None,
            "config_sha256": None,
            "checkpoint_sha256": None,
        }
    ],
}


def default_cache_root() -> Path:
    return (Path.home() / ".cache" / "simvq").expanduser()


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    _ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _positive_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def _infer_tokens_per_chunk(chunk_size: int, model_cfg: dict[str, Any]) -> int | None:
    strides = model_cfg.get("enc_down_strides")
    if not isinstance(strides, (list, tuple)) or not strides:
        return None
    factor = 1
    for stride in strides:
        try:
            factor *= int(stride)
        except (TypeError, ValueError):
            return None
    if factor <= 0 or (int(chunk_size) % factor) != 0:
        return None
    return int(chunk_size) // factor


def _version_from_checkpoint_name(checkpoint_path: Path) -> str:
    match = re.fullmatch(r"checkpoint_(\d+)", checkpoint_path.name)
    if match:
        return match.group(1)
    return checkpoint_path.name or "local"


def _extract_runtime_config(config_json_path: Path, *, variant: str | None = None) -> dict[str, Any]:
    payload = _load_json(config_json_path)
    model_cfg = dict(payload.get("model") or payload.get("model_config") or {})
    data_cfg = dict(payload.get("data") or {})
    train_data_cfg = dict(data_cfg.get("train") or {})

    resolved_variant = str(model_cfg.get("variant") or variant or "v45")
    model_cfg.setdefault("variant", resolved_variant)

    chunk_size = (
        _positive_int(train_data_cfg.get("segment_samples"))
        or _positive_int(data_cfg.get("segment_samples"))
        or _positive_int(payload.get("chunk_size"))
        or 12288
    )
    hop_size = (
        _positive_int(train_data_cfg.get("segment_hop_samples"))
        or _positive_int(data_cfg.get("segment_hop_samples"))
        or _positive_int(payload.get("hop_size"))
        or int(chunk_size)
    )
    tokens_per_chunk = _positive_int(payload.get("tokens_per_chunk")) or _infer_tokens_per_chunk(chunk_size, model_cfg)
    if tokens_per_chunk is None:
        raise ModelStoreError(
            f"Unable to infer tokens_per_chunk from config: {config_json_path}"
        )

    codebook_size = (
        _positive_int(payload.get("codebook_size"))
        or _positive_int(model_cfg.get("codebook_size"))
        or 65536
    )
    return {
        "variant": resolved_variant,
        "chunk_size": int(chunk_size),
        "hop_size": int(hop_size),
        "tokens_per_chunk": int(tokens_per_chunk),
        "codebook_size": int(codebook_size),
        "model_config": model_cfg,
    }


def _download_to_path(url: str, output_path: Path) -> None:
    _ensure_dir(output_path.parent)
    with urlopen(url) as response, output_path.open("wb") as handle:
        shutil.copyfileobj(response, handle)


def _coerce_remote_model(item: dict[str, Any]) -> RemoteModelSpec:
    return RemoteModelSpec(
        name=str(item["name"]),
        version=str(item["version"]),
        variant=str(item["variant"]),
        mode=str(item["mode"]),
        config_url=item.get("config_url"),
        checkpoint_url=item.get("checkpoint_url"),
        config_sha256=item.get("config_sha256"),
        checkpoint_sha256=item.get("checkpoint_sha256"),
    )


class ModelCatalogClient:
    def __init__(self, catalog_url: str | None = None):
        self.catalog_url = catalog_url

    def _load_catalog_payload(self) -> dict[str, Any]:
        if not self.catalog_url:
            return DEFAULT_CATALOG

        parsed = urlparse(self.catalog_url)
        if parsed.scheme in {"http", "https"}:
            with urlopen(self.catalog_url) as response:
                data = response.read().decode("utf-8")
            return json.loads(data)

        path = Path(self.catalog_url).expanduser().resolve()
        if not path.exists():
            raise ModelCatalogError(f"Catalog path does not exist: {path}")
        return _load_json(path)

    def list_remote(self) -> list[RemoteModelSpec]:
        payload = self._load_catalog_payload()
        items = payload.get("models", [])
        if not isinstance(items, list):
            raise ModelCatalogError("Remote catalog is missing a valid 'models' list.")
        return [_coerce_remote_model(item) for item in items]

    def get_remote(self, name: str) -> RemoteModelSpec:
        wanted = str(name).strip()
        for item in self.list_remote():
            if item.name == wanted:
                return item
        raise ModelCatalogError(f"Model not found in remote catalog: {wanted}")


class ModelStore:
    def __init__(self, root: Path | None = None, catalog_client: ModelCatalogClient | None = None):
        self.root = (root or default_cache_root() / "models").expanduser().resolve()
        self.catalog_client = catalog_client or ModelCatalogClient()
        _ensure_dir(self.root)

    def _model_dir(self, spec: RemoteModelSpec) -> Path:
        return self.root / spec.name / spec.version

    def _metadata_path(self, model_dir: Path) -> Path:
        return model_dir / "metadata.json"

    def list_local(self) -> list[CachedModel]:
        result: list[CachedModel] = []
        if not self.root.exists():
            return result
        for model_root in sorted(path for path in self.root.iterdir() if path.is_dir()):
            for version_root in sorted(path for path in model_root.iterdir() if path.is_dir()):
                metadata_path = self._metadata_path(version_root)
                config_path = version_root / "config.json"
                if not metadata_path.exists() or not config_path.exists():
                    continue
                payload = _load_json(metadata_path)
                checkpoint_relpath = payload.get("checkpoint_relpath")
                checkpoint_candidates: list[Path] = []
                if isinstance(checkpoint_relpath, str) and checkpoint_relpath:
                    checkpoint_candidates.append(version_root / checkpoint_relpath)
                checkpoint_candidates.extend(
                    [
                        version_root / "checkpoint.msgpack",
                        version_root / "checkpoint",
                    ]
                )
                checkpoint_path = next((path for path in checkpoint_candidates if path.exists()), None)
                result.append(
                    CachedModel(
                        name=str(payload["name"]),
                        version=str(payload["version"]),
                        variant=str(payload["variant"]),
                        mode=str(payload["mode"]),
                        local_dir=version_root,
                        config_path=config_path,
                        checkpoint_path=checkpoint_path,
                    )
                )
        return result

    def has_local(self, name: str) -> bool:
        try:
            self.get_local(name)
        except ModelStoreError:
            return False
        return True

    def get_local(self, name: str) -> CachedModel:
        matches = [item for item in self.list_local() if item.name == name]
        if not matches:
            raise ModelStoreError(f"Model is not cached locally: {name}")
        matches.sort(key=lambda item: item.version)
        return matches[-1]

    def pull(self, name: str) -> CachedModel:
        spec = self.catalog_client.get_remote(name)
        model_dir = self._model_dir(spec)
        _ensure_dir(model_dir)

        config_path = model_dir / "config.json"
        checkpoint_path = model_dir / "checkpoint.msgpack"
        metadata_path = self._metadata_path(model_dir)

        if spec.mode == "stub_random":
            config_payload = {
                "model_name": spec.name,
                "model_version": spec.version,
                "variant": spec.variant,
                "mode": spec.mode,
                "chunk_size": 12288,
                "hop_size": 11688,
                "tokens_per_chunk": 4096,
                "codebook_size": 65536,
                "seed": 0,
            }
            _write_json(config_path, config_payload)
            checkpoint_path.write_bytes(b"stub model checkpoint placeholder\n")
        else:
            if not spec.config_url:
                raise ModelStoreError(f"Real model is missing config_url: {spec.name}")
            if not spec.checkpoint_url:
                raise ModelStoreError(f"Real model is missing checkpoint_url: {spec.name}")
            _download_to_path(spec.config_url, config_path)
            _download_to_path(spec.checkpoint_url, checkpoint_path)
            if spec.config_sha256 and _sha256_file(config_path) != spec.config_sha256:
                raise ModelStoreError(f"Config hash mismatch for model: {spec.name}")
            if spec.checkpoint_sha256 and _sha256_file(checkpoint_path) != spec.checkpoint_sha256:
                raise ModelStoreError(f"Checkpoint hash mismatch for model: {spec.name}")

        _write_json(
            metadata_path,
            {
                "name": spec.name,
                "version": spec.version,
                "variant": spec.variant,
                "mode": spec.mode,
                "checkpoint_relpath": "checkpoint.msgpack",
            },
        )
        return self.get_local(spec.name)

    def register_local(
        self,
        *,
        name: str,
        checkpoint_path: str | Path,
        config_json_path: str | Path,
        version: str | None = None,
        variant: str | None = None,
        overwrite: bool = False,
    ) -> CachedModel:
        checkpoint_src = Path(checkpoint_path).expanduser().resolve()
        config_json = Path(config_json_path).expanduser().resolve()

        if not checkpoint_src.exists():
            raise ModelStoreError(f"Checkpoint path does not exist: {checkpoint_src}")
        if not config_json.exists():
            raise ModelStoreError(f"Config JSON path does not exist: {config_json}")

        runtime_cfg = _extract_runtime_config(config_json, variant=variant)
        resolved_version = str(version or _version_from_checkpoint_name(checkpoint_src))
        resolved_variant = str(variant or runtime_cfg["variant"])

        model_dir = self.root / str(name) / resolved_version
        if model_dir.exists():
            if not overwrite:
                raise ModelStoreError(f"Local model already exists: {name}@{resolved_version}")
            shutil.rmtree(model_dir)
        _ensure_dir(model_dir)

        config_path = model_dir / "config.json"
        metadata_path = self._metadata_path(model_dir)
        checkpoint_link = model_dir / "checkpoint"

        config_payload = {
            "model_name": str(name),
            "model_version": resolved_version,
            "variant": resolved_variant,
            "mode": "jax_builtin",
            "chunk_size": int(runtime_cfg["chunk_size"]),
            "hop_size": int(runtime_cfg["hop_size"]),
            "tokens_per_chunk": int(runtime_cfg["tokens_per_chunk"]),
            "codebook_size": int(runtime_cfg["codebook_size"]),
            "model_config": runtime_cfg["model_config"],
        }
        _write_json(config_path, config_payload)

        if checkpoint_link.exists() or checkpoint_link.is_symlink():
            if checkpoint_link.is_dir() and not checkpoint_link.is_symlink():
                shutil.rmtree(checkpoint_link)
            else:
                checkpoint_link.unlink()
        checkpoint_link.symlink_to(checkpoint_src, target_is_directory=checkpoint_src.is_dir())

        _write_json(
            metadata_path,
            {
                "name": str(name),
                "version": resolved_version,
                "variant": resolved_variant,
                "mode": "jax_builtin",
                "checkpoint_relpath": "checkpoint",
            },
        )
        return self.get_local(str(name))

    def remove(self, name: str) -> None:
        target = self.root / name
        if not target.exists():
            raise ModelStoreError(f"No local model cache found for: {name}")
        shutil.rmtree(target)
