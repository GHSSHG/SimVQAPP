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
                "mode": "jax_external_repo",
                "chunk_size": 12288,
                "hop_size": 11688,
                "tokens_per_chunk": 4096,
                "codebook_size": 65536,
                "source_repo_path": "/private/tmp/SimVQGAN",
                "source_config_json": "/private/tmp/SimVQGAN/configs/train.json",
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
        mode="jax_external_repo",
        local_dir=model_dir,
        config_path=config_path,
        checkpoint_path=checkpoint_path,
    )


def _make_external_repo(tmp_path):
    repo_root = tmp_path / "SimVQGAN"
    codec_dir = repo_root / "codec"
    codec_dir.mkdir(parents=True)
    (codec_dir / "__init__.py").write_text("", encoding="utf-8")
    (codec_dir / "models.py").write_text("def build_audio_model(config):\n    return config\n", encoding="utf-8")
    return repo_root


def test_runtime_health_for_stub_model_is_ready(tmp_path):
    store = ModelStore(root=tmp_path / "models")
    cached = store.pull("simvq-v45-stub")

    health = runtime_health(cached)

    assert health["ready"] is True
    assert health["checkpoint_exists"] is True
    assert health["issues"] == []
    assert health["resolved_source_repo_path"] is None


def test_runtime_health_uses_env_override_for_external_repo(tmp_path, monkeypatch):
    cached = _make_real_cached_model(tmp_path)
    repo_root = _make_external_repo(tmp_path)
    monkeypatch.setenv("SIMVQ_MODEL_SOURCE_REPO", str(repo_root))

    health = runtime_health(cached)

    assert health["ready"] is True
    assert health["checkpoint_exists"] is True
    assert health["resolved_source_repo_path"] == str(repo_root.resolve())
    assert health["resolved_source_repo_from"] == "env:SIMVQ_MODEL_SOURCE_REPO"
    assert health["issues"] == []


def test_runtime_health_reports_missing_external_repo_when_unresolved(tmp_path, monkeypatch):
    cached = _make_real_cached_model(tmp_path)
    monkeypatch.delenv("SIMVQ_MODEL_SOURCE_REPO", raising=False)
    monkeypatch.delenv("SIMVQ_SOURCE_REPO_PATH", raising=False)

    health = runtime_health(cached)

    assert health["ready"] is False
    assert health["checkpoint_exists"] is True
    assert health["resolved_source_repo_path"] is None
    assert any("Configured source repo does not exist:" in issue for issue in health["issues"])
    assert any("A compatible SimVQGAN source repo is required" in issue for issue in health["issues"])
