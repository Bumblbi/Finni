"""HTTP smoke through Nginx, including API restart. Run from project root."""
import json
import subprocess
import time
import urllib.error
import urllib.request
from uuid import uuid4

BASE = "http://127.0.0.1:8080"


def request(path, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers)
    with urllib.request.urlopen(req, timeout=5) as response:
        return json.load(response)


assert request("/health/ready")["status"] == "ready"
created = request("/api/v1/profiles", {"nickname": "Smoke"})
token = created["access_token"]
result = request("/api/v1/income", {"operation_id": str(uuid4()), "epoch": 1, "expected_revision": 0}, token)
assert result["state"]["balance"]["wallet"] == 100
subprocess.run(["docker", "compose", "restart", "api"], check=True, timeout=60)
for attempt in range(30):
    try:
        restored = request("/api/v1/state", token=token)
        break
    except (urllib.error.URLError, TimeoutError):
        if attempt == 29:
            raise
        time.sleep(1)
assert restored == result["state"]
assert len(request("/api/v1/catalog")) == 17
schema = request("/openapi.json")
assert "/api/v1/sync" in schema["paths"]
print("PASS: Nginx HTTP, profile, income, catalog, OpenAPI and persisted state after API restart")
