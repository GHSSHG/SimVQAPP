from __future__ import annotations

import json
from pathlib import Path

from ..bundle import load_manifest


def run(args) -> int:
    manifest = load_manifest(Path(args.bundle))
    if args.json:
        print(json.dumps(manifest, indent=2, ensure_ascii=False))
        return 0

    print("SimVQ Bundle Inspect")
    print(f"Format: {manifest.get('bundle_format')}")
    model = manifest.get("model", {})
    print(f"Model: {model.get('model_name')} version={model.get('model_version')} mode={model.get('source_mode')}")
    chunking = manifest.get("chunking", {})
    print(
        "Chunking: "
        f"chunk_size={chunking.get('chunk_size')} "
        f"hop_size={chunking.get('hop_size')} "
        f"short_chunk_policy={chunking.get('short_chunk_policy')}"
    )
    counts = manifest.get("counts", {})
    print(f"Counts: reads={counts.get('read_count')} chunks={counts.get('chunk_count')}")
    return 0
