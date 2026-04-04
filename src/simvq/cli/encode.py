from __future__ import annotations

import json
from pathlib import Path

from ..codec import SimVQCodec
from ..types import EncodeRequest


def run(args) -> int:
    codec = SimVQCodec()
    result = codec.encode(
        EncodeRequest(
            input_pod5=Path(args.input_pod5),
            output_bundle=Path(args.output),
            model_name=args.model,
            batch_size=args.batch_size,
            chunk_size=args.chunk_size,
            hop_size=args.hop_size,
            short_chunk_policy=args.short_chunk_policy,
            overwrite=args.overwrite,
            summary_json=(None if args.summary_json is None else Path(args.summary_json)),
        )
    )
    print(
        json.dumps(
            {
                "output_bundle": str(result.output_bundle),
                "read_count": result.read_count,
                "chunk_count": result.chunk_count,
                "raw_bundle_size_bytes": result.raw_bundle_size_bytes,
                "packed_bundle_size_bytes": result.packed_bundle_size_bytes,
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0
