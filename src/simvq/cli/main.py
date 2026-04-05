from __future__ import annotations

import argparse
import traceback

from ..errors import SimVQError
from ..version import __version__
from . import decode as decode_cmd
from . import doctor as doctor_cmd
from . import encode as encode_cmd
from . import inspect as inspect_cmd
from . import model as model_cmd


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="simvq", description="SimVQ inference CLI")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser("doctor", help="Check environment and dependencies")
    doctor.add_argument("--json", action="store_true")
    doctor.set_defaults(func=doctor_cmd.run)

    inspect_parser = sub.add_parser("inspect", help="Inspect a .vq or .vq.tar.gz bundle")
    inspect_parser.add_argument("bundle")
    inspect_parser.add_argument("--json", action="store_true")
    inspect_parser.set_defaults(func=inspect_cmd.run)

    encode = sub.add_parser("encode", help="Encode POD5 to .vq.tar.gz")
    encode.add_argument("input_pod5")
    encode.add_argument("--model", required=True)
    encode.add_argument("--output", required=True)
    encode.add_argument("--batch-size", type=int, default=128)
    encode.add_argument("--chunk-size", type=int, default=12288)
    encode.add_argument("--hop-size", type=int, default=11688)
    encode.add_argument("--short-chunk-policy", default="normalize_then_zero_pad")
    encode.add_argument("--summary-json")
    encode.add_argument("--overwrite", action="store_true")
    encode.set_defaults(func=encode_cmd.run)

    decode = sub.add_parser("decode", help="Decode .vq.tar.gz to POD5")
    decode.add_argument("input_bundle")
    decode.add_argument("--model", required=True)
    decode.add_argument("--output", required=True)
    decode.add_argument("--batch-size", type=int, default=128)
    decode.add_argument("--summary-json")
    decode.add_argument("--overwrite", action="store_true")
    decode.set_defaults(func=decode_cmd.run)

    model = sub.add_parser("model", help="Manage remote and local models")
    model_sub = model.add_subparsers(dest="model_command", required=True)

    list_remote = model_sub.add_parser("list-remote", help="List remote models")
    list_remote.add_argument("--catalog-url")
    list_remote.set_defaults(func=model_cmd.run_list_remote)

    list_local = model_sub.add_parser("list-local", help="List locally cached models")
    list_local.set_defaults(func=model_cmd.run_list_local)

    pull = model_sub.add_parser("pull", help="Download or materialize a model into the local cache")
    pull.add_argument("name")
    pull.add_argument("--catalog-url")
    pull.set_defaults(func=model_cmd.run_pull)

    register_local = model_sub.add_parser("register-local", help="Register a local checkpoint into the cache")
    register_local.add_argument("name")
    register_local.add_argument("--checkpoint", required=True)
    register_local.add_argument("--source-repo", help=argparse.SUPPRESS)
    register_local.add_argument("--config-json", required=True)
    register_local.add_argument("--version")
    register_local.add_argument("--variant", default="v45")
    register_local.add_argument("--overwrite", action="store_true")
    register_local.set_defaults(func=model_cmd.run_register_local)

    show = model_sub.add_parser("show", help="Show a locally cached model")
    show.add_argument("name")
    show.set_defaults(func=model_cmd.run_show)

    remove = model_sub.add_parser("remove", help="Remove a locally cached model")
    remove.add_argument("name")
    remove.set_defaults(func=model_cmd.run_remove)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args) or 0)
    except SimVQError as exc:
        print(f"error: {exc}")
        return 1
    except Exception as exc:  # pragma: no cover - guard rail for CLI use
        print(f"unexpected error: {exc}")
        print(traceback.format_exc())
        return 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
