#!/usr/bin/env python3
"""
ORCHESTRATOR_SKILL_HOOK — UserPromptSubmit: parallel-wave orchestration nudge.

When the prompt mentions parallel-wave / multi-agent keywords, inject a reminder
to load the two installed orchestration skills BEFORE spawning workers.
A hook cannot call the Skill tool itself — it injects context that instructs the
model to do so (same mechanism as dev_rules_hook.py).

Playbook: XDEV/PLANS/SPRINT-05-BACKLOG/PARALLEL_WORKFLOW.md
"""
import sys
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Lowercase substrings. Cover Ukrainian + English stems.
WAVE_KEYWORDS = [
    "хвил",      # хвиля, хвилі, хвилю (parallel wave)
    "паралель",  # паралельн*
    "оркестр",   # оркестратор, оркестрація
    "воркер",    # worker (uk)
    "worktree",
    "subagent",
    "субагент",
    "мультиагент",
    "multi-agent",
    "multiagent",
    " wave",     # leading space to avoid matching inside unrelated words
    "wave ",
]


def get_prompt_text(stdin_data: bytes) -> str:
    try:
        data = json.loads(stdin_data.decode("utf-8", errors="replace"))
        for key in ("message", "user_message", "prompt", "content"):
            if key in data and isinstance(data[key], str):
                return data[key]
        if "messages" in data:
            msgs = data["messages"]
            if msgs and isinstance(msgs[-1], dict):
                return msgs[-1].get("content", "")
    except Exception:
        pass
    return ""


def is_wave_prompt(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in WAVE_KEYWORDS)


def main():
    try:
        raw_stdin = sys.stdin.buffer.read()
    except Exception:
        raw_stdin = b""

    prompt_text = get_prompt_text(raw_stdin)

    context_text = ""
    if is_wave_prompt(prompt_text):
        context_text = "\n".join([
            "=== PARALLEL-WAVE ORCHESTRATION DETECTED ===",
            "Before spawning any worker, load the orchestration machinery:",
            "1. Skill(skill='context-window-management') — marker-line protocol (ROLE_DONE {...}),",
            "   launch-turn barrier (spawn ALL workers in ONE turn, run_in_background:true; never merge same turn),",
            "   8 anti-patterns (route on marker only, never summarize worker prose).",
            "2. subagent-driven-development pattern — fresh worker per task + review after each + final review.",
            "Disjoint-zone rule + wave lifecycle + worker contract: XDEV/PLANS/SPRINT-05-BACKLOG/PARALLEL_WORKFLOW.md.",
            "Do NOT download orchestration/ORCHESTRATION.md — generic, inferior to the two installed skills.",
        ])

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
