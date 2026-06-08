#!/usr/bin/env python3
"""
ENV_GUARD_HOOK — PreToolUse (Edit|Write): blocks any modifications to .env* files.
Outputs blockReason (exit 2) to prevent accidental secret exposure.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BLOCKED_PATTERNS = {".env", ".env.local", ".env.production", ".env.development"}
BLOCKED_SUFFIXES = (".key", ".pem", ".p8")
BLOCKED_NAMES = {"credentials.json", "private_key.json", "secrets.json"}


def is_sensitive(file_path: str) -> bool:
    path = Path(file_path)
    name = path.name.lower()
    # Block .env* files
    if name.startswith(".env"):
        return True
    # Block by suffix
    if path.suffix.lower() in BLOCKED_SUFFIXES:
        return True
    # Block by name
    if name in BLOCKED_NAMES:
        return True
    return False


def main():
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if not file_path:
            return 0

        if is_sensitive(file_path):
            msg = (
                f"[ENV GUARD] BLOCKED: Editing '{Path(file_path).name}' is not allowed. "
                "Sensitive files (.env*, .key, credentials) are write-protected. "
                "If you need to update env vars, edit them manually in the terminal."
            )
            print(msg, file=sys.stderr)
            return 2  # Block the edit

    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
