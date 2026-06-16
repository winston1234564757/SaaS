#!/usr/bin/env python3
"""
QA_GATE_GUARD_HOOK v1.0 — PreToolUse:Edit|Write
Blocks code file edits (.ts/.tsx/.sql) if QA gate (grill-me / adversarial-reviewer)
was NOT called this session. Enforces IRON RULE #1: QA-GATE before any code.

Exit 0 = allow | Exit 2 = block
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"

# Only enforce gate on real code files (not docs, hooks, config)
GATED_EXTENSIONS = {".ts", ".tsx", ".sql"}

# Paths that bypass the gate (hooks, XDEV docs, migration scripts)
BYPASS_PREFIXES = [
    ".claude/hooks",
    "XDEV/",
    ".claude/skills",
]


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {"qa_gate_passed": False, "skills_called": []}


def is_bypass_path(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return any(prefix in normalized for prefix in BYPASS_PREFIXES)


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if not file_path:
            return 0

        path = Path(file_path)

        # Only enforce on gated extensions
        if path.suffix not in GATED_EXTENSIONS:
            return 0

        # Bypass for hook/XDEV/skill paths
        if is_bypass_path(file_path):
            return 0

        state = load_state()

        if state.get("qa_gate_passed", False):
            return 0

        # BLOCK — QA gate not passed
        msg = (
            f"\n[QA GATE BLOCK] Cannot edit {path.name}\n"
            "IRON RULE #1: QA gate not passed this session.\n"
            "\n"
            "STEP 1: Invoke Skill(skill='grill-me') to stress-test the plan.\n"
            "STEP 2: After skill completes, run via Bash tool:\n"
            "  Bash('python C:/Users/Vitossik/SaaS/.claude/hooks/set_qa_gate_passed.py grill-me')\n"
            "\n"
            "DO NOT ask the user to run this. Claude runs it via Bash tool.\n"
            "DO NOT skip grill-me and just run the script.\n"
        )
        print(msg)
        return 2

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
