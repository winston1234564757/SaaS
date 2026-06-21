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



def main():
    try:
        raw_stdin = sys.stdin.buffer.read()
    except Exception:
        raw_stdin = b""

    prompt_text = get_prompt_text(raw_stdin)
    task_mode = is_task_prompt(prompt_text)

    lines = [
        "Active protocol: CLAUDE.md (IRON RULES) + XDEV/PLANS/SPRINT-05-BACKLOG/WORKFLOW.md (task types + Task Brief gate).",
    ]

    # Task-type prompt → inject concise gate pointing to WORKFLOW.md Task Brief flow
    if task_mode:
        lines += [
            "",
            "=== TASK GATE (before code) ===",
            "1. mempalace_search the task topic",
            "2. Read current files (+ screenshot for REDESIGN)",
            "3. Write BRIEFS/[ID].md (Task Brief) -> user APPROVE",
            "4. Declare + invoke specialist skill from BACKLOG (same response)",
            "5. UI text -> humanizer. Per-type depth + Tiers: WORKFLOW.md",
            "Active task + NEXT: SPRINT-05-BACKLOG/HANDOFF.md (ignore XDEV/TASK.md, stale Sprint-04).",
        ]

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
