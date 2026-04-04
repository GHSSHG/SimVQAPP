import numpy as np

from simvq.model_store import ModelStore
from simvq.runtime import ModelRuntime


def test_stub_runtime_round_trip_shapes(tmp_path):
    store = ModelStore(root=tmp_path / "models")
    cached = store.pull("simvq-v45-stub")
    runtime = ModelRuntime.from_cached_model(cached)
    chunks = np.zeros((2, runtime.chunk_size), dtype=np.float32)
    token_ids = runtime.encode_normalized_chunks(chunks, batch_size=2)
    decoded = runtime.decode_token_chunks(token_ids, batch_size=2)
    assert token_ids.shape == (2, runtime.tokens_per_chunk)
    assert decoded.shape == (2, runtime.chunk_size)
