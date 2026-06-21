#!/usr/bin/env python3
"""
SKILL_GUARD_HOOK v3.0 — Stop event (end-of-turn enforcement).

Replaces the old per-prompt nag (which fired on every task-keyword prompt and
added noise). Now runs on Stop. Stays SILENT unless there is a real violation:
code files were edited this session but no specialist work-skill was ever
invoked. In that case it surfaces a single systemMessage.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"

CODE_EXT = (".ts", ".tsx", ".js", ".jsx", ".css")

# Skills that count as real implementation/design work (not pure meta/workflow).
WORK_SKILLS = {
    "design-taste-frontend", "impeccable", "impeccable-design-polish",
    "emilkowalski-motion", "senior-frontend", "senior-backend", "nextjs",
    "nextjs-app-router-patterns", "scroll-experience", "landing-page-guide-v2",
    "diagnose", "focused-fix", "spec-driven-workflow", "create-migration",
    "react-best-practices", "tanstack-query", "zustand-state-management",
    "tailwind-v4-shadcn", "progressive-web-app", "auth-implementation-patterns",
    "payment-gateway-integration", "domain-expert-scheduling", "security-review",
    "humanizer", "supabase-automation", "react-doctor", "improve-codebase-architecture",
}


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def main() -> int:
    # Drain the Stop payload; we don't need it.
    try:
        sys.stdin.buffer.read()
    except Exception:
        pass

    state = load_state()
    edit_counts = state.get("edit_counts", {})
    skills_called = set(state.get("skills_called", []))

    code_edited = any(
        cnt > 0 and str(path).lower().endswith(CODE_EXT)
        for path, cnt in edit_counts.items()
    )
    has_work_skill = bool(skills_called & WORK_SKILLS)

    if code_edited and not has_work_skill:
        msg = (
            "Skill gate: code files were edited this session without any specialist "
            "skill (design-taste-frontend / senior-frontend / senior-backend / "
            "diagnose / ...). Per IRON RULE #2, declare + invoke the right skill "
            "from SPRINT-05-BACKLOG/BACKLOG.md before the next code change."
        )
        print(json.dumps({"systemMessage": msg}, ensure_ascii=False))
        return 0

    print(json.dumps({}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
