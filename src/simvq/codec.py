from __future__ import annotations

import json
import tempfile
from dataclasses import asdict
from pathlib import Path

import numpy as np

from .bundle import BundlePackager, BundleReader, BundleWriter, is_bundle_dir, is_bundle_tar_gz
from .chunking import DecodedChunk, overlap_add_valid_only, prepare_padded_chunks
from .errors import BundleError, RuntimeNotReadyError
from .model_store import ModelStore
from .pod5_templates import Pod5TemplateSerializer, require_pod5
from .runtime import ModelRuntime
from .types import BundleManifest, DecodeRequest, DecodeResult, EncodeRequest, EncodeResult


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _float_or_center(value: float, fallback: float = 0.0) -> float:
    if np.isfinite(value):
        return float(value)
    return float(fallback)


def _to_picoamps(signal_adc: np.ndarray, calibration: dict[str, float]) -> np.ndarray:
    adc = np.asarray(signal_adc, dtype=np.float32)
    offset = float(calibration["offset"])
    scale = float(calibration["scale"])
    safe_scale = scale if np.isfinite(scale) and scale != 0.0 else 1.0
    return (adc + offset) * safe_scale


def _to_adc(signal_pa: np.ndarray, calibration: dict[str, float]) -> np.ndarray:
    pa = np.asarray(signal_pa, dtype=np.float32)
    offset = float(calibration["offset"])
    scale = float(calibration["scale"])
    safe_scale = scale if np.isfinite(scale) and scale != 0.0 else 1.0
    adc = (pa / safe_scale) - offset
    return np.asarray(np.clip(np.rint(adc), -32768, 32767), dtype=np.int16)


def _ensure_model_runtime(model_name: str) -> tuple[object, ModelRuntime]:
    store = ModelStore()
    if not store.has_local(model_name):
        cached = store.pull(model_name)
    else:
        cached = store.get_local(model_name)
    return cached, ModelRuntime.from_cached_model(cached)


def _token_dtype(codebook_size: int) -> str:
    return "uint16" if int(codebook_size) <= 65536 else "uint32"


def _token_numpy_dtype(codebook_size: int):
    return np.uint16 if int(codebook_size) <= 65536 else np.uint32


def _derive_bundle_dir_name(output_bundle: Path) -> str:
    name = output_bundle.name
    if name.endswith(".vq.tar.gz"):
        return name[: -len(".tar.gz")]
    if name.endswith(".vq"):
        return name
    return name + ".vq"


class SimVQCodec:
    """High-level POD5 encode/decode entrypoint.

    The project skeleton wires the command surface and low-level helpers first.
    Full POD5 I/O is intentionally left as the next implementation slice.
    """

    def encode(self, request: EncodeRequest) -> EncodeResult:
        pod5 = require_pod5()
        input_pod5 = request.input_pod5.expanduser().resolve()
        output_bundle = request.output_bundle.expanduser().resolve()
        if not input_pod5.exists():
            raise RuntimeNotReadyError(f"Input POD5 does not exist: {input_pod5}")
        if output_bundle.exists() and not request.overwrite:
            raise RuntimeNotReadyError(f"Output bundle already exists: {output_bundle}")

        cached, runtime = _ensure_model_runtime(request.model_name)
        serializer = Pod5TemplateSerializer()

        run_info_table: list[dict] = []
        run_info_map: dict[str, int] = {}
        end_reason_table: list[dict] = []
        end_reason_map: dict[str, int] = {}
        read_records: list[dict] = []
        token_batches: list[np.ndarray] = []
        norm_stat_rows: list[tuple[float, float]] = []
        valid_length_rows: list[int] = []
        start_rows: list[int] = []

        total_chunk_count = 0
        with pod5.Reader(str(input_pod5)) as reader:
            for read_index, record in enumerate(reader.reads()):
                template = serializer.extract_from_record(record)
                run_info_payload = serializer.serialize_run_info(record.run_info)
                end_reason_payload = serializer.serialize_end_reason(record.end_reason)

                run_key = json.dumps(run_info_payload, sort_keys=True, ensure_ascii=False)
                if run_key not in run_info_map:
                    run_info_map[run_key] = len(run_info_table)
                    run_info_table.append(run_info_payload)
                end_key = json.dumps(end_reason_payload, sort_keys=True, ensure_ascii=False)
                if end_key not in end_reason_map:
                    end_reason_map[end_key] = len(end_reason_table)
                    end_reason_table.append(end_reason_payload)

                template = serializer.extract_from_record(record)
                template = type(template)(
                    **{
                        **asdict(template),
                        "run_info_index": run_info_map[run_key],
                        "end_reason_index": end_reason_map[end_key],
                    }
                )

                raw_signal = np.asarray(record.signal, dtype=np.int16)
                calibration = template.calibration
                pa_signal = _to_picoamps(raw_signal, calibration)
                prepared = prepare_padded_chunks(
                    pa_signal,
                    chunk_size=request.chunk_size,
                    hop_size=request.hop_size,
                )
                if not prepared:
                    continue
                normalized_batch = np.stack([item.normalized for item in prepared], axis=0).astype(np.float32)
                token_ids = runtime.encode_normalized_chunks(normalized_batch, batch_size=request.batch_size)
                token_batches.append(token_ids)
                norm_stat_rows.extend((float(item.center), float(item.half_range)) for item in prepared)
                valid_length_rows.extend(int(item.valid_length) for item in prepared)
                start_rows.extend(int(item.start) for item in prepared)

                read_records.append(
                    {
                        "read_index": int(read_index),
                        "read_id": str(template.read_id),
                        "raw_length": int(raw_signal.size),
                        "trimmed_length": int(raw_signal.size),
                        "chunk_offset": int(total_chunk_count),
                        "chunk_count": int(len(prepared)),
                        "sample_rate_hz": int(record.run_info.sample_rate),
                        "template": asdict(template),
                    }
                )
                total_chunk_count += int(len(prepared))

        if not read_records:
            raise RuntimeNotReadyError(f"No reads were encoded from POD5: {input_pod5}")

        with tempfile.TemporaryDirectory(prefix="simvq_encode_") as tmpdir:
            tmpdir_path = Path(tmpdir)
            bundle_dir = tmpdir_path / _derive_bundle_dir_name(output_bundle)
            manifest = {
                "bundle_format": "simvq.vq/v1",
                "packaging": {
                    "kind": "tar.gz",
                    "inner_bundle_dir": bundle_dir.name,
                },
                "tool": {
                    "name": "simvq",
                    "version": "0.1.0",
                },
                "model": {
                    "model_name": cached.name,
                    "model_version": cached.version,
                    "model_variant": cached.variant,
                    "source_mode": cached.mode,
                    "config_sha256": None,
                    "checkpoint_sha256": None,
                    "codebook_size": runtime.codebook_size,
                    "token_dtype": _token_dtype(runtime.codebook_size),
                },
                "chunking": {
                    "chunk_size": int(request.chunk_size),
                    "hop_size": int(request.hop_size),
                    "short_chunk_policy": str(request.short_chunk_policy),
                    "pad_value_in_normalized_space": 0.0,
                    "reconstruction_mode": str(request.reconstruction_mode),
                    "tokens_per_chunk": runtime.tokens_per_chunk,
                },
                "counts": {
                    "read_count": int(len(read_records)),
                    "chunk_count": int(total_chunk_count),
                },
                "paths": {
                    "reads": "reads.jsonl",
                    "run_infos": "metadata/run_infos.json",
                    "end_reasons": "metadata/end_reasons.json",
                    "token_shards": ["chunks/tokens.000.npy"],
                    "norm_stat_shards": ["chunks/norm_stats.000.npy"],
                    "valid_length_shards": ["chunks/valid_lengths.000.npy"],
                    "start_shards": ["chunks/starts.000.npy"],
                },
            }

            writer = BundleWriter()
            writer.open_dir(bundle_dir, BundleManifest(**manifest))
            writer.write_metadata_tables(run_info_table, end_reason_table)
            for record in read_records:
                writer.write_read_record(record)
            writer.write_token_shard(
                np.concatenate(token_batches, axis=0).astype(_token_numpy_dtype(runtime.codebook_size), copy=False)
            )
            writer.write_norm_stat_shard(np.asarray(norm_stat_rows, dtype=np.float32))
            writer.write_valid_length_shard(np.asarray(valid_length_rows, dtype=np.int32))
            writer.write_start_shard(np.asarray(start_rows, dtype=np.int64))
            writer.close()

            raw_bundle_size_bytes = sum(path.stat().st_size for path in bundle_dir.rglob("*") if path.is_file())
            packager = BundlePackager()
            packed_path = packager.pack(bundle_dir, output_bundle)
            packed_bundle_size_bytes = packed_path.stat().st_size

        result = EncodeResult(
            output_bundle=output_bundle,
            read_count=len(read_records),
            chunk_count=total_chunk_count,
            raw_bundle_size_bytes=int(raw_bundle_size_bytes),
            packed_bundle_size_bytes=int(packed_bundle_size_bytes),
        )
        if request.summary_json is not None:
            _write_json(
                request.summary_json,
                {
                    "command": "encode",
                    "input_path": str(input_pod5),
                    "output_path": str(output_bundle),
                    "model_name": cached.name,
                    "model_version": cached.version,
                    "model_mode": cached.mode,
                    "read_count": result.read_count,
                    "chunk_count": result.chunk_count,
                    "raw_bundle_size_bytes": result.raw_bundle_size_bytes,
                    "packed_bundle_size_bytes": result.packed_bundle_size_bytes,
                },
            )
        return result

    def decode(self, request: DecodeRequest) -> DecodeResult:
        pod5 = require_pod5()
        input_bundle = request.input_bundle.expanduser().resolve()
        output_pod5 = request.output_pod5.expanduser().resolve()
        if output_pod5.exists() and not request.overwrite:
            raise RuntimeNotReadyError(f"Output POD5 already exists: {output_pod5}")

        cached, runtime = _ensure_model_runtime(request.model_name)
        serializer = Pod5TemplateSerializer()

        with tempfile.TemporaryDirectory(prefix="simvq_decode_") as tmpdir:
            tmpdir_path = Path(tmpdir)
            if is_bundle_tar_gz(input_bundle):
                bundle_dir = BundlePackager().unpack(input_bundle, tmpdir_path)
            elif is_bundle_dir(input_bundle):
                bundle_dir = input_bundle
            else:
                raise BundleError(f"Unsupported bundle input: {input_bundle}")

            reader = BundleReader()
            reader.open(bundle_dir)
            manifest = reader.manifest().to_dict()
            model_meta = manifest.get("model", {})
            if str(model_meta.get("model_name")) != cached.name:
                raise RuntimeNotReadyError(
                    f"Bundle expects model {model_meta.get('model_name')}, but got {cached.name}."
                )

            metadata_tables = reader.load_metadata_tables()
            read_records = list(reader.iter_read_records())
            token_ids = np.concatenate(list(reader.iter_token_shards()), axis=0)
            norm_stats = np.concatenate(list(reader.iter_norm_stat_shards()), axis=0)
            valid_lengths = np.concatenate(list(reader.iter_valid_length_shards()), axis=0)
            starts = np.concatenate(list(reader.iter_start_shards()), axis=0)

            decoded_norm = runtime.decode_token_chunks(token_ids, batch_size=request.batch_size)
            output_pod5.parent.mkdir(parents=True, exist_ok=True)
            if output_pod5.exists():
                output_pod5.unlink()
            with pod5.Writer(str(output_pod5), software_name="simvq") as writer:
                for record in read_records:
                    chunk_offset = int(record["chunk_offset"])
                    chunk_count = int(record["chunk_count"])
                    template_dict = dict(record["template"])
                    from .pod5_templates import Pod5ReadTemplate

                    template_obj = Pod5ReadTemplate(**template_dict)
                    calibration = template_obj.calibration
                    decoded_chunks: list[DecodedChunk] = []
                    for idx in range(chunk_offset, chunk_offset + chunk_count):
                        center = _float_or_center(float(norm_stats[idx][0]), 0.0)
                        half_range = float(norm_stats[idx][1])
                        valid_length = int(valid_lengths[idx])
                        start = int(starts[idx])
                        valid_norm = np.asarray(decoded_norm[idx][:valid_length], dtype=np.float32)
                        if not np.isfinite(half_range) or np.isclose(half_range, 0.0):
                            pa_valid = np.full((valid_length,), center, dtype=np.float32)
                        else:
                            pa_valid = valid_norm * half_range + center
                        decoded_chunks.append(
                            DecodedChunk(start=start, valid_length=valid_length, values=pa_valid.astype(np.float32))
                        )

                    reconstructed_pa = overlap_add_valid_only(decoded_chunks, total_length=total_length)
                    reconstructed_adc = _to_adc(reconstructed_pa, calibration)
                    read = serializer.build_pod5_read(template_obj, reconstructed_adc, metadata_tables)
                    writer.add_read(read)

        result = DecodeResult(
            output_pod5=output_pod5,
            read_count=len(read_records),
            chunk_count=int(token_ids.shape[0]),
        )
        if request.summary_json is not None:
            _write_json(
                request.summary_json,
                {
                    "command": "decode",
                    "input_path": str(input_bundle),
                    "output_path": str(output_pod5),
                    "model_name": cached.name,
                    "model_version": cached.version,
                    "model_mode": cached.mode,
                    "read_count": result.read_count,
                    "chunk_count": result.chunk_count,
                },
            )
        return result
