#!/usr/bin/env python3
"""
DEV_RULES_HOOK — UserPromptSubmit: iron rules + mandatory task gate.
Parses stdin JSON to detect task-type prompts and inject blocking checklist.
"""
import sys
import json
import re
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TASK_FILE = Path("C:/Users/Vitossik/SaaS/XDEV/TASK.md")
MAX_TASK_CHARS = 1400

TASK_KEYWORDS = [
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10',
    'задача', 'task', 'зроби', 'зробити', 'fix', 'фікс', 'баг', 'bug',
    'створ', 'add ', 'покращ', 'redesign', 'рефактор', 'додай', 'виправ',
    'build ', 'implement', 'реалізу',
]

SESSION_KEYWORDS = [
    'привіт', 'hello', 'hi ', 'ок продовжу', 'нова сесія', 'починаємо',
    'start', 'wake', 'старт', 'почни',
]


def get_prompt_text(stdin_data: bytes) -> str:
    try:
        data = json.loads(stdin_data.decode("utf-8", errors="replace"))
        # Claude Code sends the user message under different keys
        for key in ("message", "user_message", "prompt", "content"):
            if key in data and isinstance(data[key], str):
                return data[key]
        # Sometimes nested
        if "messages" in data:
            msgs = data["messages"]
            if msgs and isinstance(msgs[-1], dict):
                return msgs[-1].get("content", "")
    except Exception:
        pass
    return ""


def is_task_prompt(text: str) -> bool:
    t = text.lower()
    return any(kw.lower() in t for kw in TASK_KEYWORDS)


def is_session_start(text: str) -> bool:
    t = text.lower()
    return any(kw.lower() in t for kw in SESSION_KEYWORDS) or len(t.strip()) < 20


def main():
    try:
        raw_stdin = sys.stdin.buffer.read()
    except Exception:
        raw_stdin = b""

    prompt_text = get_prompt_text(raw_stdin)
    task_mode = is_task_prompt(prompt_text)
    session_start = is_session_start(prompt_text) or not prompt_text

    lines = [
        "=== IRON RULES ACTIVE (no exceptions) ===",
        "- RULE -1: mempalace_status on wake-up | mempalace_search before decisions",
        "- RULE 0:  encoding check before Edit/Write Cyrillic files",
        "- RULE 0.5: all UI text -> /humanizer (except aria-label, data-testid, dates)",
        "- RULE 1:  QA-GATE: clarify -> plan -> user ok -> code",
        "- RULE 2:  Skills Decision Tree -> declare skill before iteration",
        "- RULE 3:  Post-Change: tsc -> build -> mempalace_add_drawer -> SYSTEM_MAP",
        "- RULE 4:  Framer: mode='popLayout' | spring as const | no emoji in UI",
        "",
        "=== SKILL INVOCATION ENFORCEMENT (ZERO TOLERANCE) ===",
        "Writing 'SKILL: [name]' in text WITHOUT calling the Skill tool = PROTOCOL VIOLATION.",
        "CORRECT: write 'SKILL: impeccable' → in the SAME response, call Skill tool with skill='impeccable'",
        "WRONG:   write 'SKILL: impeccable' → explain what you'll do → forget to call the tool",
        "WRONG:   write 'Invoking skill...' → never actually invoke",
        "RULE: text declaration + Skill tool call MUST appear in the same response turn.",
        "If you declare a skill → the very next tool call in that turn MUST be Skill(skill='...').",
        "",
    ]

    # Session start → force mempalace + SYSTEM_MAP
    if session_start:
        lines += [
            "=== SESSION START PROTOCOL (MANDATORY — first response) ===",
            "You MUST complete these before any other action:",
            "  1. Call mempalace_status NOW (tool call, not just mention)",
            "  2. Read last 40 lines of XDEV/MAPS/SYSTEM_MAP.md",
            "  3. Reply: 'STARTUP OK: Palace [N drawers] | SYSTEM_MAP current'",
            "NO CODE until startup confirmed.",
            "",
        ]

    # Task-type prompt → inject mandatory gate with skill routing
    if task_mode:
        t = prompt_text.lower()

        # Detect task type for specific QA-GATE skills
        bug_kw     = ['fix', 'bug', 'broken', 'error', 'crash', 'виправ', 'фікс', 'баг']
        design_kw  = ['redesign', 'design', 'ui ', 'component', 'дизайн', 'компонент', 'зовніш']
        feature_kw = ['feature', 'add ', 'implement', 'create', 'фіча', 'додай', 'реалізу', 'зроби', 'налаштуван']
        db_kw      = ['migration', 'schema', 'rls', ' sql', 'database', 'міграці']
        refactor_kw= ['refactor', 'рефактор', 'simplify', 'cleanup']

        is_bug     = any(kw in t for kw in bug_kw)
        is_design  = any(kw in t for kw in design_kw) or any(kw in t for kw in feature_kw)
        is_db      = any(kw in t for kw in db_kw)
        is_refactor= any(kw in t for kw in refactor_kw)

        if is_db:
            qa_skills = "Skill('grill-me') + Skill('security-review')"
        elif is_bug or is_refactor:
            qa_skills = "Skill('grill-me') + Skill('adversarial-reviewer')"
        elif is_design:
            qa_skills = "Skill('brainstorming') + Skill('grill-me')"
        else:
            qa_skills = "Skill('grill-me')"

        lines += [
            "=== MANDATORY TASK GATE (complete BEFORE opening any file) ===",
            "  [ ] 1. mempalace_search — search relevant context for THIS task",
            f" [ ] 2. QA Gate — invoke {qa_skills} (task-type detected from prompt)",
            "  [ ] 3. Skill Route — check SKILL ROUTE suggestion above, declare + invoke",
            "  [ ] 4. Humanizer — list ALL UI strings, run /humanizer, confirm",
            "  [ ] 5. Wait for user approval",
            "",
            "After gate: reply 'GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: [status]'",
            "ONLY THEN: open files and write code.",
            "",
        ]

    if TASK_FILE.exists():
        try:
            tasks = TASK_FILE.read_text(encoding="utf-8")
            lines.append("=== TASK.md (active tasks) ===")
            lines.append(tasks[:MAX_TASK_CHARS])
            if len(tasks) > MAX_TASK_CHARS:
                lines.append("... (truncated)")
        except Exception as e:
            lines.append(f"WARNING: TASK.md unreadable — {e}")

    context_text = "\n".join(lines)

    # Output as JSON additionalContext — injected directly into model context
    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context_text
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
