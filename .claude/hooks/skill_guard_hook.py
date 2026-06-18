#!/usr/bin/env python3
"""
SKILL_GUARD_HOOK v2.0 — UserPromptSubmit (early enforcement).

Fires at task START (not Stop). Checks session_state.skills_called:
  - If no skills called yet + task prompt → inject MANDATORY skill selection notice
  - If skills already called → inject reminder of which skills were used

Goal: enforce skill selection at the BEGINNING of each task, not retroactively at session end.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE    = Path(__file__).parent / "state" / "session_state.json"
TAXONOMY_FILE = Path(__file__).parent / "skills-taxonomy.json"

TASK_KEYWORDS = [
    'зроби', 'задача', 'task', 'fix', 'фікс', 'баг', 'bug', 'створ', 'add ',
    'покращ', 'redesign', 'рефактор', 'додай', 'виправ', 'build ', 'implement',
    'реалізу', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9',
    'зміни', 'оновити', 'налашту', 'конфігур', 'переробити',
]

SESSION_KEYWORDS = ['привіт', 'hello', 'hi ', 'нова сесія', 'startup ok', 'починаємо', 'wake', 'старт']


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def get_prompt_text(data: dict) -> str:
    for key in ("message", "user_message", "prompt", "content"):
        if key in data and isinstance(data[key], str):
            return data[key]
    if "messages" in data:
        msgs = data.get("messages", [])
        if msgs and isinstance(msgs[-1], dict):
            return msgs[-1].get("content", "")
    return ""


def is_session_start(text: str) -> bool:
    t = text.lower().strip()
    return len(t) < 15 or any(kw in t for kw in SESSION_KEYWORDS)


def is_task_prompt(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in TASK_KEYWORDS)


def get_quick_skill_menu() -> str:
    """Load taxonomy and return compact skill menu by category."""
    try:
        if not TAXONOMY_FILE.exists():
            return ""
        taxonomy = json.loads(TAXONOMY_FILE.read_text(encoding="utf-8"))
        lines = []
        for cat, data in taxonomy.get("categories", {}).items():
            skills = [s["name"] for s in data.get("skills", [])]
            if skills:
                top = skills[:3]
                lines.append(f"  {cat}: {' | '.join(top)}")
        return "\n".join(lines)
    except Exception:
        return ""


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        print(json.dumps({}))
        return 0

    prompt = get_prompt_text(data)
    if not prompt or is_session_start(prompt) or not is_task_prompt(prompt):
        print(json.dumps({}))
        return 0

    state         = load_state()
    skills_called = state.get("skills_called", [])
    qa_passed     = state.get("qa_gate_passed", False)

    lines = []

    if not skills_called:
        # No skill selected yet — inject mandatory notice with quick menu
        menu = get_quick_skill_menu()
        lines = [
            "=== SKILL SELECTION REQUIRED (Iron Rule #2) ===",
            "No skill invoked yet this session.",
            "You MUST select and invoke a skill BEFORE writing code.",
            "",
            "QUICK MENU (top skills per category):",
            menu,
            "",
            "HOW: write 'SKILL: [name]' AND call Skill(skill='[name]') in the SAME response.",
            "DO NOT write 'SKILL: X' without immediately calling the Skill tool.",
        ]
    else:
        # Skills were called — show which ones as context
        skills_str = ", ".join(skills_called[:5])
        qa_str = "QA gate: PASSED" if qa_passed else "QA gate: NOT PASSED"
        lines = [
            f"Skills used this session: {skills_str} | {qa_str}",
            "If starting a new task type, invoke the appropriate skill again.",
        ]

    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": "\n".join(lines)
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
