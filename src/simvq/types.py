from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class RemoteModelSpec:
    name: str
    version: str
    variant: str
    mode: str
    config_url: str | None
    checkpoint_url: str | None
    config_sha256: str | None
    checkpoint_sha256: str | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class CachedModel:
    name: str
    version: str
    variant: str
    mode: str
    local_dir: Path
    config_path: Path
    checkpoint_path: Path | None

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["local_dir"] = str(self.local_dir)
        payload["config_path"] = str(self.config_path)
        payload["checkpoint_path"] = None if self.checkpoint_path is None else str(self.checkpoint_path)
        return payload


@dataclass(frozen=True)
class BundleManifest:
    bundle_format: str
    tool: dict[str, Any]
    packaging: dict[str, Any]
    model: dict[str, Any]
    chunking: dict[str, Any]
    counts: dict[str, Any]
    paths: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class EncodeRequest:
    input_pod5: Path
    output_bundle: Path
    model_name: str
    batch_size: int = 128
    chunk_size: int = 12288
    hop_size: int = 11688
    short_chunk_policy: str = "normalize_then_zero_pad"
    reconstruction_mode: str = "overlap_add_valid_only"
    overwrite: bool = False
    summary_json: Path | None = None


@dataclass(frozen=True)
class DecodeRequest:
    input_bundle: Path
    output_pod5: Path
    model_name: str
    batch_size: int = 128
    overwrite: bool = False
    summary_json: Path | None = None


@dataclass(frozen=True)
class EncodeResult:
    output_bundle: Path
    read_count: int
    chunk_count: int
    raw_bundle_size_bytes: int
    packed_bundle_size_bytes: int


@dataclass(frozen=True)
class DecodeResult:
    output_pod5: Path
    read_count: int
    chunk_count: int
