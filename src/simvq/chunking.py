from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import numpy as np

CHUNK_SIZE_DEFAULT = 12288
HOP_SIZE_DEFAULT = 11688


@dataclass(frozen=True)
class PreparedChunk:
    start: int
    valid_length: int
    center: float
    half_range: float
    normalized: np.ndarray


@dataclass(frozen=True)
class DecodedChunk:
    start: int
    valid_length: int
    values: np.ndarray


def normalize_to_pm1_with_stats(signal: np.ndarray, eps: float = 1e-6) -> tuple[np.ndarray, float, float]:
    arr = np.asarray(signal, dtype=np.float32).reshape(-1)
    if arr.size == 0:
        return arr, 0.0, 0.0
    x_min = float(np.min(arr))
    x_max = float(np.max(arr))
    center = 0.5 * (x_min + x_max)
    half_range = 0.5 * (x_max - x_min)
    if not np.isfinite(center):
        center = 0.0
    if not np.isfinite(half_range) or half_range < eps:
        return np.zeros_like(arr, dtype=np.float32), center, 0.0
    normalized = np.clip((arr - center) / half_range, -1.0, 1.0)
    return normalized.astype(np.float32), center, half_range


def iter_chunk_starts(total_length: int, chunk_size: int = CHUNK_SIZE_DEFAULT, hop_size: int = HOP_SIZE_DEFAULT) -> list[int]:
    total_length = max(0, int(total_length))
    chunk_size = max(1, int(chunk_size))
    hop_size = max(1, int(hop_size))
    if total_length <= 0:
        return []
    if total_length <= chunk_size:
        return [0]

    starts: list[int] = []
    pos = 0
    while (pos + chunk_size) <= total_length:
        starts.append(pos)
        pos += hop_size

    last_full_end = starts[-1] + chunk_size
    if last_full_end < total_length:
        starts.append(starts[-1] + hop_size)
    return starts


def prepare_chunk(
    signal_pa: np.ndarray,
    *,
    start: int,
    chunk_size: int = CHUNK_SIZE_DEFAULT,
) -> PreparedChunk:
    values = np.asarray(signal_pa, dtype=np.float32).reshape(-1)
    valid_length = int(values.size)
    if valid_length <= 0:
        raise ValueError("Chunk must contain at least one valid sample.")
    normalized, center, half_range = normalize_to_pm1_with_stats(values)
    padded = np.zeros((int(chunk_size),), dtype=np.float32)
    padded[:valid_length] = normalized
    return PreparedChunk(
        start=int(start),
        valid_length=valid_length,
        center=float(center),
        half_range=float(half_range),
        normalized=padded,
    )


def prepare_padded_chunks(
    signal_pa: np.ndarray,
    *,
    chunk_size: int = CHUNK_SIZE_DEFAULT,
    hop_size: int = HOP_SIZE_DEFAULT,
) -> list[PreparedChunk]:
    arr = np.asarray(signal_pa, dtype=np.float32).reshape(-1)
    starts = iter_chunk_starts(arr.size, chunk_size=chunk_size, hop_size=hop_size)
    chunks: list[PreparedChunk] = []
    for start in starts:
        stop = min(arr.size, start + chunk_size)
        chunks.append(prepare_chunk(arr[start:stop], start=start, chunk_size=chunk_size))
    return chunks


def overlap_add_valid_only(chunks: Sequence[DecodedChunk], total_length: int) -> np.ndarray:
    total_length = max(0, int(total_length))
    acc = np.zeros((total_length,), dtype=np.float32)
    weight = np.zeros((total_length,), dtype=np.float32)
    for chunk in chunks:
        start = int(chunk.start)
        valid = int(chunk.valid_length)
        if valid <= 0:
            continue
        stop = min(total_length, start + valid)
        if stop <= start:
            continue
        values = np.asarray(chunk.values, dtype=np.float32).reshape(-1)
        acc[start:stop] += values[: stop - start]
        weight[start:stop] += 1.0
    return np.divide(acc, np.where(weight > 0.0, weight, 1.0)).astype(np.float32)
