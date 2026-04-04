import numpy as np

from simvq.chunking import (
    CHUNK_SIZE_DEFAULT,
    DecodedChunk,
    HOP_SIZE_DEFAULT,
    iter_chunk_starts,
    overlap_add_valid_only,
    prepare_padded_chunks,
)


def test_short_read_is_padded_after_normalization():
    signal = np.linspace(-2.0, 3.0, 100, dtype=np.float32)
    chunks = prepare_padded_chunks(signal, chunk_size=CHUNK_SIZE_DEFAULT, hop_size=HOP_SIZE_DEFAULT)
    assert len(chunks) == 1
    assert chunks[0].valid_length == 100
    assert chunks[0].normalized.shape == (CHUNK_SIZE_DEFAULT,)
    assert np.allclose(chunks[0].normalized[100:], 0.0)


def test_tail_chunk_is_emitted_when_last_window_is_short():
    starts = iter_chunk_starts(13000, chunk_size=12288, hop_size=11688)
    assert starts == [0, 11688]


def test_overlap_add_uses_only_valid_region():
    chunks = [
        DecodedChunk(start=0, valid_length=4, values=np.array([1.0, 1.0, 1.0, 1.0], dtype=np.float32)),
        DecodedChunk(start=2, valid_length=2, values=np.array([3.0, 3.0], dtype=np.float32)),
    ]
    out = overlap_add_valid_only(chunks, total_length=4)
    assert np.allclose(out, np.array([1.0, 1.0, 2.0, 2.0], dtype=np.float32))
