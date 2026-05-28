#!/usr/bin/env python3
"""
EDIT_RULES_HOOK — PreToolUse (Edit|Write): encoding guard before any file modification.
Checks cp1251 mojibake + curly quotes. Blocks edit (exit 2) if file is corrupted.
"""
import sys
import json
from pathlib import Path

# Force UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Real mojibake: Cyrillic "R" (Р = \xd0\xa0) immediately followed by a C2-prefix Latin char.
# Normal Ukrainian text never has this. Patterns \xd0\xa0\xd0 and \xd0\xa0\xd1 are FALSE
# POSITIVES — they match any Ukrainian word starting with "Р" (e.g. "Редагування").
MOJIBAKE = [b"\xd0\xa0\xc2"]
CURLY_DOUBLE = [b"\xe2\x80\x9c", b"\xe2\x80\x9d"]
CURLY_SINGLE = [b"\xe2\x80\x98", b"\xe2\x80\x99"]

CHECKABLE_EXTENSIONS = {".ts", ".tsx", ".md", ".py", ".json", ".sql", ".txt"}


def main():
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if not file_path:
            return 0

        path = Path(file_path)
        if not path.exists() or path.suffix not in CHECKABLE_EXTENSIONS:
            return 0

        with open(path, "rb") as f:
            raw = f.read()

        # Only check files with Cyrillic bytes
        if b"\xd0" not in raw and b"\xd1" not in raw:
            return 0

        issues = []
        if any(pat in raw for pat in MOJIBAKE):
            issues.append("cp1251 mojibake")
        if any(pat in raw for pat in CURLY_DOUBLE):
            issues.append('curly double quotes')
        if any(pat in raw for pat in CURLY_SINGLE):
            issues.append("curly single quotes")

        if issues:
            print(f"[ENCODING GUARD] EDIT BLOCKED: {path.name}")
            print(f"  Issues: {', '.join(issues)}")
            print(f"  Fix first: XDEV/ENCODING_FIX_PROMPT.md")
            print(f"  Full path: {file_path}")
            return 2  # Block the edit

        return 0

    except Exception:
        return 0  # Never block on unexpected error


if __name__ == "__main__":
    sys.exit(main())
