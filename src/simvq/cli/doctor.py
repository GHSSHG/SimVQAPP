from __future__ import annotations

import importlib
import json
import platform
import sys

from ..model_store import ModelStore, default_cache_root


def run(args) -> int:
    checks = {}
    for module_name in ("numpy", "pod5", "jax", "flax", "orbax.checkpoint"):
        try:
            importlib.import_module(module_name)
            checks[module_name] = "ok"
        except Exception as exc:
            checks[module_name] = f"missing: {exc}"

    store = ModelStore()
    payload = {
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "cache_root": str(default_cache_root()),
        "local_model_count": len(store.list_local()),
        "checks": checks,
    }
    if getattr(args, "json", False):
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 0

    print("SimVQ Doctor")
    print(f"Python: {payload['python']}")
    print(f"Platform: {payload['platform']}")
    print(f"Cache root: {payload['cache_root']}")
    print(f"Local models: {payload['local_model_count']}")
    for key, value in checks.items():
        print(f"{key}: {value}")
    return 0
