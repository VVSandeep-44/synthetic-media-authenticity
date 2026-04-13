class MediaAnalysisError(Exception):
    """Base application exception for media analysis domain errors."""


class ModelNotLoadedError(MediaAnalysisError):
    """Raised when model checkpoint cannot be loaded for inference."""


class CheckpointNotFoundError(ModelNotLoadedError):
    """Raised when the configured model checkpoint file does not exist."""


class InvalidCheckpointError(ModelNotLoadedError):
    """Raised when a checkpoint cannot be deserialized or is incompatible."""


class EmptyUploadError(MediaAnalysisError):
    """Raised when an uploaded file has no content."""


class UnsupportedMediaTypeError(MediaAnalysisError):
    """Raised when an upload is sent to the wrong endpoint for its media type."""


class VideoProcessingError(MediaAnalysisError):
    """Raised when video decoding or frame extraction fails."""


class RuntimeDependencyError(MediaAnalysisError):
    """Raised when required runtime libraries cannot be loaded in the host environment."""
