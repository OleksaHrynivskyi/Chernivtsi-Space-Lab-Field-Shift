"""Кеш у JSON-файлах (папка backend/cache), щоб не смикати API щоразу."""
import json
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


def _path(key: str) -> Path:
    safe = "".join(ch if ch.isalnum() or ch in "-_." else "_" for ch in key)
    return CACHE_DIR / f"{safe}.json"


def load(key: str):
    path = _path(key)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def save(key: str, data) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    _path(key).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def cached(key: str, fetch):
    """Бере з кешу, а якщо там нема, то викликає fetch() і зберігає."""
    data = load(key)
    if data is None:
        data = fetch()
        save(key, data)
    return data
