"""Internal SimVQGAN inference model definitions.

Only the inference-side model builder and module graph are vendored here.
Source snapshot: GHSSHG/SimVQGAN @ 3f09dc5a1a9a3744b366ffa8428c0500e7df215d.
"""

from .factory import build_audio_model

__all__ = ["build_audio_model"]
