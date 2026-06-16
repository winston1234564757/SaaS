#!/usr/bin/env python3
"""
SET_QA_GATE_PASSED — Manual fallback when PostToolUse:Skill hook doesn't fire.
Run via Bash tool: python C:/Users/Vitossik/SaaS/.claude/hooks/set_qa_gate_passed.py [skill_name]
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"


def main():
    skill = sys.argv[1] if len(sys.argv) > 1 else "grill-me"

    try:
        if STATE_FILE.exists():
            state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        else:
            state = {"edit_counts": {}, "consecutive_reads": 0, "read_files": [],
                     "qa_gate_passed": False, "skills_called": []}

        state["qa_gate_passed"] = True
        if skill not in state.setdefault("skills_called", []):
            state["skills_called"].append(skill)

        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"QA GATE PASSED: {skill} -> qa_gate_passed=True")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
