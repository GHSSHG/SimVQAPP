import json

from simvq.model_store import ModelCatalogClient, ModelStore


def test_builtin_catalog_contains_stub_model(tmp_path):
    client = ModelCatalogClient()
    names = [item.name for item in client.list_remote()]
    assert "simvq-v45-stub" in names


def test_pull_stub_model_creates_local_cache(tmp_path):
    store = ModelStore(root=tmp_path / "models")
    cached = store.pull("simvq-v45-stub")
    assert cached.name == "simvq-v45-stub"
    assert cached.config_path.exists()
    assert store.has_local("simvq-v45-stub")


def test_register_local_model_creates_symlinked_checkpoint(tmp_path):
    source_repo = tmp_path / "SimVQGAN"
    source_repo.mkdir()
    checkpoint = tmp_path / "checkpoint_1200000"
    checkpoint.mkdir()
    (checkpoint / "_METADATA").write_text("{}", encoding="utf-8")
    config_json = tmp_path / "train.json"
    config_json.write_text(
        json.dumps(
            {
                "model": {
                    "variant": "v45",
                    "enc_down_strides": [3],
                    "codebook_size": 65536,
                },
                "data": {
                    "segment_samples": 12288,
                    "segment_hop_samples": 11688,
                },
            }
        ),
        encoding="utf-8",
    )

    store = ModelStore(root=tmp_path / "models")
    cached = store.register_local(
        name="simvq-v45-3x",
        checkpoint_path=checkpoint,
        source_repo_path=source_repo,
        config_json_path=config_json,
    )

    assert cached.name == "simvq-v45-3x"
    assert cached.version == "1200000"
    assert cached.checkpoint_path is not None
    assert cached.checkpoint_path.is_symlink()
    payload = json.loads(cached.config_path.read_text(encoding="utf-8"))
    assert payload["mode"] == "jax_external_repo"
    assert payload["tokens_per_chunk"] == 4096
    assert payload["source_repo_path"] == str(source_repo.resolve())
