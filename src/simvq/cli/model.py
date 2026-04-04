from __future__ import annotations

import json

from ..model_store import ModelCatalogClient, ModelStore
from ..runtime import runtime_summary


def run_list_remote(args) -> int:
    items = [item.to_dict() for item in ModelCatalogClient(catalog_url=args.catalog_url).list_remote()]
    print(json.dumps(items, indent=2, ensure_ascii=False))
    return 0


def run_list_local(args) -> int:
    items = [item.to_dict() for item in ModelStore().list_local()]
    print(json.dumps(items, indent=2, ensure_ascii=False))
    return 0


def run_pull(args) -> int:
    store = ModelStore(catalog_client=ModelCatalogClient(catalog_url=args.catalog_url))
    model = store.pull(args.name)
    payload = model.to_dict()
    payload["runtime"] = runtime_summary(model)
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def run_register_local(args) -> int:
    model = ModelStore().register_local(
        name=args.name,
        checkpoint_path=args.checkpoint,
        source_repo_path=args.source_repo,
        config_json_path=args.config_json,
        version=args.version,
        variant=args.variant,
        overwrite=bool(args.overwrite),
    )
    payload = model.to_dict()
    payload["runtime"] = runtime_summary(model)
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def run_show(args) -> int:
    model = ModelStore().get_local(args.name)
    payload = model.to_dict()
    payload["runtime"] = runtime_summary(model)
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def run_remove(args) -> int:
    ModelStore().remove(args.name)
    print(json.dumps({"removed": args.name}, ensure_ascii=False))
    return 0
