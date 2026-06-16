#!/usr/bin/env python3
"""
SKILL_TRACKER_HOOK v1.0 — PostToolUse:Skill
Tracks which skills were called this session.
Sets qa_gate_passed=True when a QA-gate skill (grill-me, adversarial-reviewer) is called.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"

QA_GATE_SKILLS = {
    "grill-me",
    "adversarial-reviewer",
    "adversarial-review",
    "grill_me",
    "adversarial_reviewer",
}


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {"edit_counts": {}, "consecutive_reads": 0, "read_files": [],
            "qa_gate_passed": False, "skills_called": []}


def save_state(state: dict) -> None:
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})
        skill_name = tool_input.get("skill", "").strip().lower()

        if not skill_name:
            return 0

        state = load_state()
        skills_called = state.setdefault("skills_called", [])

        if skill_name not in skills_called:
            skills_called.append(skill_name)

        # Mark QA gate passed if a gate skill was called
        if skill_name in QA_GATE_SKILLS:
            state["qa_gate_passed"] = True

        save_state(state)

    except Exception:
        pass

    print(json.dumps({}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
