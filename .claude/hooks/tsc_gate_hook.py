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

# Allow N consecutive TS edits before requiring TSC — batch mode.
# At N=8: for a 9-file task with 3 edits/file = 27 edits = ~3 TSC runs instead of 27.
MAX_TS_EDITS_BEFORE_TSC = 8

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
        edits_since_tsc = state.get("ts_edits_since_tsc", 0)

        if edits_since_tsc < MAX_TS_EDITS_BEFORE_TSC:
            return 0

        # BLOCK — batch limit reached
        fname = path.name
        msg = (
            f"\n[TSC GATE BLOCK] Cannot edit '{fname}'\n"
            f"Batch limit: {edits_since_tsc}/{MAX_TS_EDITS_BEFORE_TSC} TS edits since last tsc run.\n\n"
            "Run this first:\n"
            "  Bash('cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit')\n\n"
            "Gate unlocks automatically after tsc runs. Fix any errors first.\n"
        )
        print(msg)
        return 2

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
