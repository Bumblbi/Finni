"""Run from the repository root after installing the project."""
import json
from pathlib import Path

from app.main import app

path = Path("docs/openapi.json")
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
