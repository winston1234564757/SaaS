#!/usr/bin/env python3
"""
TSC_GATE_HOOK — PreToolUse (Edit|Write):
If a .ts/.tsx file was edited since the last tsc run, BLOCKS the next edit
and requires running `npx tsc --noEmit` first.

Enforces IRON RULE #3: Post-Change must include tsc check.
Exit 0 = allow | Exit 2 = block
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"

TS_EXTENSIONS = {".ts", ".tsx"}

BYPASS_PREFIXES = [
    ".claude/hooks",
    "XDEV/",
    ".claude/skills",
    ".claude/CLAUDE.md",
]


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def is_bypass(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return any(p in normalized for p in BYPASS_PREFIXES)


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))

        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if not file_path:
            return 0

        path = Path(file_path)

        if path.suffix not in TS_EXTENSIONS:
            return 0

        if is_bypass(file_path):
            return 0

        state = load_state()

        if not state.get("ts_edited_since_tsc"):
            return 0

        # BLOCK — tsc not run since last TS edit
        fname = path.name
        msg = (
            f"\n[TSC GATE BLOCK] Cannot edit '{fname}'\n"
            "IRON RULE #3: TypeScript was edited but tsc was not run.\n\n"
            "Run this first:\n"
            "  Bash('cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit')\n\n"
            "Fix any errors, then the gate will unlock automatically.\n"
            "Do NOT skip this check — type errors must be resolved before next edit.\n"
        )
        print(msg)
        return 2

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
