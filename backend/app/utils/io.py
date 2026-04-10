from __future__ import annotations

from pathlib import Path

from fastapi import UploadFile


async def read_upload_bytes(file: UploadFile) -> bytes:
    return await file.read()


def detect_media_kind(filename: str | None, content_type: str | None) -> str:
    name = (filename or '').lower()
    media_type = (content_type or '').lower()

    if name.endswith(('.mp4', '.mov', '.avi', '.mkv')) or media_type.startswith('video/'):
        return 'video'
    return 'image'


def ensure_directory(path: str | Path) -> Path:
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory
