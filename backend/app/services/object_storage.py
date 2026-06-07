"""
BIBI Cars — Wave 11.2 / 13 — Object Storage Abstraction
========================================================

Thin abstraction so we can swap the storage backend without touching
routers. Today: `LocalStorage` (filesystem under `/app/backend/uploads`).
Tomorrow: add `S3Storage` / `R2Storage` with the same surface.

Public API:

    storage = get_storage()
    info = await storage.put(prefix, filename, data, content_type)
        # → {key, url, size, content_type, filename}
    stream = storage.open(key)              # binary file-like
    storage.delete(key)
    storage.path(key)                       # absolute fs path (Local only)

Key convention:  `<prefix>/<uuid>__<safe_filename>`

The `url` returned is always a stable cabinet-served URL of the form
`/api/files/<key>`, never a presigned URL. The cabinet's auth
middleware protects the file route, so file URLs follow the same
scope rules as the rest of the API.
"""
from __future__ import annotations
import os
import re
import uuid
import shutil
import mimetypes
from pathlib import Path
from typing import BinaryIO, Dict, Any, Optional

UPLOAD_ROOT = Path(os.environ.get("BIBI_UPLOAD_ROOT", "/app/backend/uploads")).resolve()
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


def _sanitize_filename(name: str) -> str:
    name = (name or "file").strip().split("/")[-1].split("\\")[-1]
    name = _SAFE_NAME_RE.sub("_", name)[:120]
    return name or "file"


def _safe_prefix(prefix: str) -> str:
    parts = [p for p in (prefix or "misc").split("/") if p and p not in (".", "..")]
    return "/".join(_SAFE_NAME_RE.sub("_", p) for p in parts) or "misc"


class LocalStorage:
    backend = "local"

    def __init__(self, root: Path = UPLOAD_ROOT):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------ put
    async def put(
        self,
        prefix: str,
        filename: str,
        data: bytes,
        content_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        safe_prefix = _safe_prefix(prefix)
        safe_name = _sanitize_filename(filename)
        key = f"{safe_prefix}/{uuid.uuid4().hex[:12]}__{safe_name}"
        dest = (self.root / key).resolve()

        # Prevent path-traversal escape
        if not str(dest).startswith(str(self.root)):
            raise ValueError("unsafe path")

        dest.parent.mkdir(parents=True, exist_ok=True)
        with dest.open("wb") as f:
            f.write(data)

        size = dest.stat().st_size
        ct = content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
        return {
            "key":          key,
            "url":          f"/api/files/{key}",
            "size":         size,
            "content_type": ct,
            "filename":     safe_name,
            "backend":      self.backend,
        }

    # ----------------------------------------------------------------- open
    def open(self, key: str) -> BinaryIO:
        p = self.path(key)
        return p.open("rb")

    def path(self, key: str) -> Path:
        # Reject absolute / traversal inputs
        clean = key.lstrip("/")
        if ".." in clean.split("/"):
            raise ValueError("unsafe key")
        p = (self.root / clean).resolve()
        if not str(p).startswith(str(self.root)):
            raise ValueError("unsafe key")
        if not p.exists() or not p.is_file():
            raise FileNotFoundError(key)
        return p

    # --------------------------------------------------------------- delete
    def delete(self, key: str) -> bool:
        try:
            p = self.path(key)
        except FileNotFoundError:
            return False
        try:
            p.unlink()
            # Best-effort empty-dir cleanup
            parent = p.parent
            try:
                next(parent.iterdir())
            except StopIteration:
                shutil.rmtree(parent, ignore_errors=True)
            return True
        except Exception:
            return False


_storage: Optional[LocalStorage] = None


def get_storage() -> LocalStorage:
    global _storage
    if _storage is None:
        _storage = LocalStorage()
    return _storage


__all__ = ["LocalStorage", "get_storage", "UPLOAD_ROOT"]
