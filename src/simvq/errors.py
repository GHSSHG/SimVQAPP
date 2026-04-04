class SimVQError(RuntimeError):
    """Base error for the SimVQ CLI package."""


class DependencyError(SimVQError):
    """Raised when an optional runtime dependency is unavailable."""


class ModelCatalogError(SimVQError):
    """Raised when remote model catalog resolution fails."""


class ModelStoreError(SimVQError):
    """Raised when local model cache operations fail."""


class BundleError(SimVQError):
    """Raised when a .vq or .vq.tar.gz bundle is invalid."""


class RuntimeNotReadyError(SimVQError):
    """Raised when the selected runtime mode is not implemented yet."""
