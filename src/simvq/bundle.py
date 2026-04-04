from __future__ import annotations

import inspect
import json
import tarfile
import tempfile
from pathlib import Path
from typing import Iterator

import numpy as np

from .errors import BundleError
from .types import BundleManifest


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def is_bundle_dir(path: Path) -> bool:
    return path.is_dir() and path.name.endswith(".vq")


def is_bundle_tar_gz(path: Path) -> bool:
    return path.is_file() and str(path).endswith(".vq.tar.gz")


class BundleWriter:
    def __init__(self) -> None:
        self.bundle_dir: Path | None = None
        self._token_index = 0
        self._norm_index = 0
        self._valid_index = 0
        self._start_index = 0

    def open_dir(self, bundle_dir: Path, manifest: BundleManifest) -> None:
        self.bundle_dir = bundle_dir
        (bundle_dir / "metadata").mkdir(parents=True, exist_ok=True)
        (bundle_dir / "chunks").mkdir(parents=True, exist_ok=True)
        _write_json(bundle_dir / "manifest.json", manifest.to_dict())

    def _require_dir(self) -> Path:
        if self.bundle_dir is None:
            raise BundleError("BundleWriter is not open.")
        return self.bundle_dir

    def write_metadata_tables(self, run_infos: list[dict], end_reasons: list[dict]) -> None:
        bundle_dir = self._require_dir()
        _write_json(bundle_dir / "metadata" / "run_infos.json", {"items": run_infos})
        _write_json(bundle_dir / "metadata" / "end_reasons.json", {"items": end_reasons})

    def write_read_record(self, record: dict) -> None:
        bundle_dir = self._require_dir()
        path = bundle_dir / "reads.jsonl"
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    def write_token_shard(self, token_ids: np.ndarray) -> None:
        bundle_dir = self._require_dir()
        np.save(bundle_dir / "chunks" / f"tokens.{self._token_index:03d}.npy", np.asarray(token_ids))
        self._token_index += 1

    def write_norm_stat_shard(self, norm_stats: np.ndarray) -> None:
        bundle_dir = self._require_dir()
        np.save(bundle_dir / "chunks" / f"norm_stats.{self._norm_index:03d}.npy", np.asarray(norm_stats))
        self._norm_index += 1

    def write_valid_length_shard(self, valid_lengths: np.ndarray) -> None:
        bundle_dir = self._require_dir()
        np.save(bundle_dir / "chunks" / f"valid_lengths.{self._valid_index:03d}.npy", np.asarray(valid_lengths))
        self._valid_index += 1

    def write_start_shard(self, starts: np.ndarray) -> None:
        bundle_dir = self._require_dir()
        np.save(bundle_dir / "chunks" / f"starts.{self._start_index:03d}.npy", np.asarray(starts))
        self._start_index += 1

    def close(self) -> None:
        self.bundle_dir = None


class BundleReader:
    def __init__(self) -> None:
        self.bundle_dir: Path | None = None

    def open(self, bundle_path: Path) -> None:
        path = bundle_path.expanduser().resolve()
        if not is_bundle_dir(path):
            raise BundleError(f"Expected an unpacked .vq directory, got: {path}")
        self.bundle_dir = path

    def _require_dir(self) -> Path:
        if self.bundle_dir is None:
            raise BundleError("BundleReader is not open.")
        return self.bundle_dir

    def manifest(self) -> BundleManifest:
        payload = _read_json(self._require_dir() / "manifest.json")
        return BundleManifest(**payload)

    def iter_read_records(self) -> Iterator[dict]:
        path = self._require_dir() / "reads.jsonl"
        if not path.exists():
            return
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                text = line.strip()
                if text:
                    yield json.loads(text)

    def _iter_shards(self, prefix: str) -> Iterator[np.ndarray]:
        chunk_dir = self._require_dir() / "chunks"
        for path in sorted(chunk_dir.glob(f"{prefix}.*.npy")):
            yield np.load(path)

    def iter_token_shards(self) -> Iterator[np.ndarray]:
        yield from self._iter_shards("tokens")

    def iter_norm_stat_shards(self) -> Iterator[np.ndarray]:
        yield from self._iter_shards("norm_stats")

    def iter_valid_length_shards(self) -> Iterator[np.ndarray]:
        yield from self._iter_shards("valid_lengths")

    def iter_start_shards(self) -> Iterator[np.ndarray]:
        yield from self._iter_shards("starts")

    def load_metadata_tables(self) -> dict[str, list[dict]]:
        bundle_dir = self._require_dir()
        run_infos_payload = _read_json(bundle_dir / "metadata" / "run_infos.json")
        end_reasons_payload = _read_json(bundle_dir / "metadata" / "end_reasons.json")
        return {
            "run_infos": list(run_infos_payload.get("items", [])),
            "end_reasons": list(end_reasons_payload.get("items", [])),
        }


class BundlePackager:
    def pack(self, bundle_dir: Path, output_tar_gz: Path) -> Path:
        bundle_dir = bundle_dir.expanduser().resolve()
        output_tar_gz = output_tar_gz.expanduser().resolve()
        if not is_bundle_dir(bundle_dir):
            raise BundleError(f"Expected a .vq directory to pack, got: {bundle_dir}")
        output_tar_gz.parent.mkdir(parents=True, exist_ok=True)
        with tarfile.open(output_tar_gz, "w:gz") as archive:
            archive.add(bundle_dir, arcname=bundle_dir.name)
        return output_tar_gz

    def unpack(self, tar_gz_path: Path, work_dir: Path) -> Path:
        tar_gz_path = tar_gz_path.expanduser().resolve()
        work_dir = work_dir.expanduser().resolve()
        if not is_bundle_tar_gz(tar_gz_path):
            raise BundleError(f"Expected a .vq.tar.gz bundle, got: {tar_gz_path}")
        work_dir.mkdir(parents=True, exist_ok=True)
        with tarfile.open(tar_gz_path, "r:gz") as archive:
            extract_kwargs = {}
            if "filter" in inspect.signature(archive.extractall).parameters:
                extract_kwargs["filter"] = "data"
            archive.extractall(work_dir, **extract_kwargs)
            names = [Path(member.name).parts[0] for member in archive.getmembers() if member.name]
        top_levels = sorted(set(names))
        if len(top_levels) != 1:
            raise BundleError("Bundle archive must contain exactly one top-level .vq directory.")
        bundle_dir = work_dir / top_levels[0]
        if not is_bundle_dir(bundle_dir):
            raise BundleError(f"Top-level extracted path is not a .vq directory: {bundle_dir}")
        return bundle_dir


def load_manifest(bundle_path: Path) -> dict:
    bundle_path = bundle_path.expanduser().resolve()
    if is_bundle_dir(bundle_path):
        return _read_json(bundle_path / "manifest.json")
    if is_bundle_tar_gz(bundle_path):
        with tempfile.TemporaryDirectory(prefix="simvq_inspect_") as tmpdir:
            bundle_dir = BundlePackager().unpack(bundle_path, Path(tmpdir))
            return _read_json(bundle_dir / "manifest.json")
    raise BundleError(f"Unsupported bundle path: {bundle_path}")
