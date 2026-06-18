#!/usr/bin/env python3
"""
PRE_COMPACT_HOOK v1.0 — PreCompact event.

Fires BEFORE context compaction. Does:
  1. Saves session_state.json snapshot → compact_state.json (survives compaction)
  2. Reads HANDOFF.md + TRACKER.md → saves compact_handoff.md summary
  3. Injects additionalContext instructing Claude to invoke handoff + context-window-management
"""
import sys
import json
from pathlib import Path
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE      = Path(__file__).parent / "state" / "session_state.json"
COMPACT_STATE   = Path(__file__).parent / "state" / "compact_state.json"
COMPACT_HANDOFF = Path(__file__).parent / "state" / "compact_handoff.md"

HANDOFF_FILE  = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md")
TRACKER_FILE  = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def save_compact_state(state: dict) -> None:
    try:
        COMPACT_STATE.parent.mkdir(parents=True, exist_ok=True)
        snapshot = {
            **state,
            "compact_timestamp": datetime.now().isoformat(),
            # Reset startup gates — after compact Claude must re-confirm startup
            "startup_confirmed": False,
            "mempalace_done": False,
            "systemmap_done": False,
        }
        COMPACT_STATE.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def get_tracker_progress() -> str:
    try:
        if not TRACKER_FILE.exists():
            return "TRACKER: unavailable"
        content = TRACKER_FILE.read_text(encoding="utf-8", errors="replace")
        for line in content.split("\n")[:30]:
            stripped = line.strip()
            if ("/" in stripped and "✅" in stripped) or "Прогрес" in stripped:
                return stripped
        return "TRACKER: no progress line found"
    except Exception:
        return "TRACKER: error"


def get_handoff_next() -> str:
    try:
        if not HANDOFF_FILE.exists():
            return "HANDOFF: unavailable"
        content = HANDOFF_FILE.read_text(encoding="utf-8", errors="replace")
        for marker in ("▶ NEXT", "**▶", "Наступна задача:", "NEXT TASK"):
            idx = content.find(marker)
            if idx != -1:
                snippet = content[idx: idx + 500]
                return "\n".join(snippet.split("\n")[:10])
        return content[:300]
    except Exception:
        return "HANDOFF: error"


def save_compact_handoff(state: dict, tracker: str, handoff: str) -> None:
    try:
        skills = ", ".join(state.get("skills_called", [])) or "none"
        qa     = "PASSED" if state.get("qa_gate_passed") else "NOT PASSED"
        ts     = "dirty (tsc not run)" if state.get("ts_edited_since_tsc") else "clean"
        ts_stamp = datetime.now().isoformat()

        content = f"""# COMPACT HANDOFF — {ts_stamp}

## Session State (restored after compact)
- skills_called: {skills}
- qa_gate_passed: {qa}
- ts_edited_since_tsc: {ts}
- startup_confirmed: False (must re-confirm after compact)

## Sprint Progress
{tracker}

## Next Task
{handoff}

## Iron Rules Reminder
- RULE -1: mempalace_status + SYSTEM_MAP before any work
- RULE 0: encoding check before Edit/Write Cyrillic
- RULE 0.5: all UI text → /humanizer
- RULE 1: QA-GATE before code
- RULE 2: Declare + invoke skill before iteration
- RULE 3: tsc → build → mempalace_add_drawer → SYSTEM_MAP
"""
        COMPACT_HANDOFF.parent.mkdir(parents=True, exist_ok=True)
        COMPACT_HANDOFF.write_text(content, encoding="utf-8")
    except Exception:
        pass


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
        trigger = data.get("trigger", "auto")
    except Exception:
        trigger = "auto"

    state   = load_state()
    tracker = get_tracker_progress()
    handoff = get_handoff_next()

    # 1. Save state snapshot
    save_compact_state(state)

    # 2. Save compact handoff file
    save_compact_handoff(state, tracker, handoff)

    # 3. Inject gate instruction for Claude
    skills_str = ", ".join(state.get("skills_called", [])) or "none"
    qa_str     = "PASSED" if state.get("qa_gate_passed") else "NOT PASSED"

    context = (
        "[PRE-COMPACT GATE] Compaction is about to happen.\n"
        "IRON RULE: You MUST call /handoff skill BEFORE compaction proceeds.\n"
        "\n"
        "STEP 1 — Call Skill(skill='handoff') RIGHT NOW in your next response.\n"
        "  → Write 'SKILL: handoff' AND call Skill(skill='handoff') in the SAME turn.\n"
        "  → Do NOT write text about handoff. CALL the skill tool.\n"
        "\n"
        "STEP 2 — After handoff completes, call Skill(skill='context-window-management').\n"
        "\n"
        "⛔ WRONG: mentioning handoff without calling Skill tool\n"
        "✅ CORRECT: Skill(skill='handoff') tool call in this very response\n"
        "\n"
        f"Session snapshot (auto-saved to compact_state.json):\n"
        f"  skills_called: {skills_str} | qa_gate: {qa_str}\n"
        f"  sprint: {tracker}\n"
        "\n"
        "PostCompact hook will restore state automatically after compact."
    )

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreCompact",
            "additionalContext": context
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
