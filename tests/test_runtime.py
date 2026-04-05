import json

import numpy as np

from simvq.model_store import ModelStore
from simvq.runtime import ModelRuntime, runtime_health
from simvq.types import CachedModel


def test_stub_runtime_round_trip_shapes(tmp_path):
    store = ModelStore(root=tmp_path / "models")
    cached = store.pull("simvq-v45-stub")
    runtime = ModelRuntime.from_cached_model(cached)
    chunks = np.zeros((2, runtime.chunk_size), dtype=np.float32)
    token_ids = runtime.encode_normalized_chunks(chunks, batch_size=2)
    decoded = runtime.decode_token_chunks(token_ids, batch_size=2)
    assert token_ids.shape == (2, runtime.tokens_per_chunk)
    assert decoded.shape == (2, runtime.chunk_size)


def _make_real_cached_model(tmp_path, *, checkpoint_exists=True):
    model_dir = tmp_path / "models" / "simvq-v45-3x" / "1200000"
    model_dir.mkdir(parents=True)
    config_path = model_dir / "config.json"
    config_path.write_text(
        json.dumps(
            {
                "model_name": "simvq-v45-3x",
                "model_version": "1200000",
                "variant": "v45",
                "mode": "jax_builtin",
                "chunk_size": 12288,
                "hop_size": 11688,
                "tokens_per_chunk": 4096,
                "codebook_size": 65536,
                "model_config": {
                    "variant": "v45",
                    "codebook_size": 65536,
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    checkpoint_path = model_dir / "checkpoint"
    if checkpoint_exists:
        checkpoint_path.write_bytes(b"checkpoint placeholder\n")
    else:
        checkpoint_path = None
    return CachedModel(
        name="simvq-v45-3x",
        version="1200000",
        variant="v45",
        mode="jax_builtin",
        local_dir=model_dir,
        config_path=config_path,
        checkpoint_path=checkpoint_path,
    )

def test_runtime_health_for_stub_model_is_ready(tmp_path):
    store = ModelStore(root=tmp_path / "models")
    cached = store.pull("simvq-v45-stub")

    health = runtime_health(cached)

    assert health["ready"] is True
    assert health["backend"] == "stub"
    assert health["checkpoint_exists"] is True
    assert health["issues"] == []


def test_runtime_health_for_builtin_model_is_ready_without_external_repo(tmp_path):
    cached = _make_real_cached_model(tmp_path)

    health = runtime_health(cached)

    assert health["ready"] is True
    assert health["backend"] == "builtin"
    assert health["checkpoint_exists"] is True
    assert health["issues"] == []


def test_runtime_health_keeps_legacy_external_mode_ready_with_builtin_builder(tmp_path):
    cached = _make_real_cached_model(tmp_path)
    payload = json.loads(cached.config_path.read_text(encoding="utf-8"))
    payload["mode"] = "jax_external_repo"
    cached.config_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    health = runtime_health(cached)

    assert health["ready"] is True
    assert health["backend"] == "builtin"
    assert health["checkpoint_exists"] is True
    assert health["issues"] == []


def test_runtime_health_reports_missing_checkpoint_for_builtin_model(tmp_path):
    cached = _make_real_cached_model(tmp_path, checkpoint_exists=False)

    health = runtime_health(cached)

    assert health["ready"] is False
    assert health["backend"] == "builtin"
    assert health["checkpoint_exists"] is False
    assert health["issues"] == ["Checkpoint path is missing."]
