import os
import uuid
from fastapi import UploadFile, HTTPException, status
import aiofiles

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | {"application/pdf", "text/plain", "application/zip"}


async def save_upload(file: UploadFile, folder: str) -> str:
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()

    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)",
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(settings.UPLOAD_DIR, folder, filename)

    os.makedirs(os.path.dirname(dest), exist_ok=True)

    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    return f"/static/{folder}/{filename}"
