import json

import numpy as np

from simvq.bundle import BundlePackager, BundleReader, BundleWriter, load_manifest
from simvq.types import BundleManifest


def test_pack_and_unpack_bundle(tmp_path):
    bundle_dir = tmp_path / "sample.vq"
    manifest = BundleManifest(
        bundle_format="simvq.vq/v1",
        tool={"name": "simvq", "version": "0.1.0"},
        packaging={"kind": "tar.gz", "inner_bundle_dir": "sample.vq"},
        model={"model_name": "simvq-v45-stub"},
        chunking={"chunk_size": 12288},
        counts={"read_count": 1, "chunk_count": 1},
        paths={},
    )
    writer = BundleWriter()
    writer.open_dir(bundle_dir, manifest)
    writer.write_metadata_tables([], [])
    writer.write_read_record({"read_index": 0})
    writer.write_token_shard(np.zeros((1, 4), dtype=np.uint16))
    writer.close()

    packed = BundlePackager().pack(bundle_dir, tmp_path / "sample.vq.tar.gz")
    unpacked = BundlePackager().unpack(packed, tmp_path / "unpacked")

    reader = BundleReader()
    reader.open(unpacked)
    loaded = reader.manifest()
    assert loaded.bundle_format == "simvq.vq/v1"
    assert list(reader.iter_read_records()) == [{"read_index": 0}]
    token_shards = list(reader.iter_token_shards())
    assert len(token_shards) == 1
    assert token_shards[0].dtype == np.uint16
    assert token_shards[0].shape == (1, 4)
    assert load_manifest(packed)["bundle_format"] == "simvq.vq/v1"
