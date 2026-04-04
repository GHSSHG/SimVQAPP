from __future__ import annotations

import json
from pathlib import Path

from ..codec import SimVQCodec
from ..types import DecodeRequest


def run(args) -> int:
    codec = SimVQCodec()
    result = codec.decode(
        DecodeRequest(
            input_bundle=Path(args.input_bundle),
            output_pod5=Path(args.output),
            model_name=args.model,
            batch_size=args.batch_size,
            overwrite=args.overwrite,
            summary_json=(None if args.summary_json is None else Path(args.summary_json)),
        )
    )
    print(
        json.dumps(
            {
                "output_pod5": str(result.output_pod5),
                "read_count": result.read_count,
                "chunk_count": result.chunk_count,
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0
