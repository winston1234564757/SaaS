#!/usr/bin/env python3
"""
POST_COMPACT_HOOK v1.0 — PostCompact event.

Fires AFTER context compaction. Does:
  1. Reads compact_handoff.md saved by PreCompact
  2. Restores session_state.json from compact_state.json (keeps skills/qa, resets startup gates)
  3. Injects handoff content as additionalContext so Claude has full context post-compact
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE      = Path(__file__).parent / "state" / "session_state.json"
COMPACT_STATE   = Path(__file__).parent / "state" / "compact_state.json"
COMPACT_HANDOFF = Path(__file__).parent / "state" / "compact_handoff.md"


def restore_session_state() -> dict:
    """Restore session state from compact snapshot. startup gates stay False."""
    try:
        if not COMPACT_STATE.exists():
            return {}
        snapshot = json.loads(COMPACT_STATE.read_text(encoding="utf-8"))

        # Build restored state: keep session progress, reset startup gates
        restored = {
            "edit_counts":          snapshot.get("edit_counts", {}),
            "consecutive_reads":    0,
            "read_files":           [],
            "qa_gate_passed":       snapshot.get("qa_gate_passed", False),
            "skills_called":        snapshot.get("skills_called", []),
            "mempalace_searched":   snapshot.get("mempalace_searched", False),
            "ts_edited_since_tsc":  snapshot.get("ts_edited_since_tsc", False),
            # Startup gates: must re-confirm after compact (context was reset)
            "startup_confirmed":    False,
            "mempalace_done":       False,
            "systemmap_done":       False,
            "post_compact":         True,  # flag for other hooks to detect post-compact state
        }

        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(restored, ensure_ascii=False, indent=2), encoding="utf-8")
        return restored
    except Exception:
        return {}


def read_compact_handoff() -> str:
    try:
        if COMPACT_HANDOFF.exists():
            return COMPACT_HANDOFF.read_text(encoding="utf-8", errors="replace")
        return ""
    except Exception:
        return ""


def main() -> int:
    # 1. Restore session state
    restored = restore_session_state()

    # 2. Read handoff
    handoff_content = read_compact_handoff()

    skills_str = ", ".join(restored.get("skills_called", [])) or "none"
    qa_str     = "PASSED" if restored.get("qa_gate_passed") else "NOT PASSED"
    ts_str     = "dirty" if restored.get("ts_edited_since_tsc") else "clean"

    if handoff_content:
        context = (
            "[POST-COMPACT] Context restored from pre-compact snapshot.\n"
            "\n"
            "=== RESTORED SESSION STATE ===\n"
            f"  skills_called: {skills_str}\n"
            f"  qa_gate: {qa_str}\n"
            f"  ts_since_tsc: {ts_str}\n"
            f"  startup_confirmed: False (must re-run startup protocol)\n"
            "\n"
            "=== HANDOFF FROM PRE-COMPACT ===\n"
            + handoff_content[:800]
            + "\n\n"
            "MANDATORY: Re-run startup protocol:\n"
            "  STEP 1: mcp__mempalace__mempalace_status\n"
            "  STEP 2: Read XDEV/MAPS/SYSTEM_MAP.md\n"
            "  STEP 3: Write 'STARTUP OK (post-compact): Palace [N] | SYSTEM_MAP current | Ready'\n"
        )
    else:
        context = (
            "[POST-COMPACT] Context compaction complete. No pre-compact handoff found.\n"
            "MANDATORY: Re-run startup protocol (STEP 1 + STEP 2 from IRON RULE -1).\n"
            f"  Restored: skills={skills_str} | qa={qa_str}\n"
        )

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostCompact",
            "additionalContext": context
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
