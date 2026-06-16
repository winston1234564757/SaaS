#!/usr/bin/env python3
"""
SESSION_START_HOOK v2.0 — SessionStart event.
Fires at the very beginning of every session.

Injects:
  1. Graphify hot-files summary (top-10 most active)
  2. Current sprint task from HANDOFF.md (▶ NEXT section)
  3. Sprint progress from TRACKER.md
  4. Mandatory startup protocol (RULE -1)

Also resets session state (edit_counter + read_tracker).
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

GRAPH_INDEX   = Path("C:/Users/Vitossik/SaaS/graphify-out/graph-index.json")
HANDOFF_FILE  = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md")
TRACKER_FILE  = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")
STATE_FILE    = Path(__file__).parent / "state" / "session_state.json"


def reset_session_state():
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(
            json.dumps({"edit_counts": {}, "consecutive_reads": 0, "read_files": []}, indent=2),
            encoding="utf-8"
        )
    except Exception:
        pass


def get_graphify_summary() -> str:
    try:
        if not GRAPH_INDEX.exists():
            return ""
        index = json.loads(GRAPH_INDEX.read_text(encoding="utf-8"))
        files = index.get("files", {})
        if not files:
            return ""
        scored = [
            (p, d["writes"], d["searches"], d.get("reads", 0))
            for p, d in files.items()
            if d["writes"] >= 2 or d["searches"] >= 5
        ]
        scored.sort(key=lambda x: x[1] * 3 + x[2], reverse=True)
        top = scored[:10]
        if not top:
            return ""
        lines = ["=== GRAPHIFY — HOT FILES (most active this project) ==="]
        for path, writes, searches, reads in top:
            name = Path(path).name
            lines.append(f"  {name}: {writes}w {searches}s {reads}r  [{path}]")
        lines.append(
            f"  (total tracked: {len(files)} files | "
            f"{index.get('total_edits', 0)} edits | "
            f"{index.get('total_searches', 0)} searches)"
        )
        lines.append("")
        return "\n".join(lines)
    except Exception:
        return ""


def get_current_task() -> str:
    """Extract ▶ NEXT task section from HANDOFF.md."""
    try:
        if not HANDOFF_FILE.exists():
            return ""
        content = HANDOFF_FILE.read_text(encoding="utf-8")
        # Find ▶ NEXT marker
        idx = content.find("▶ NEXT")
        if idx == -1:
            idx = content.find("**▶")
        if idx == -1:
            return ""
        snippet = content[idx: idx + 700]
        lines = snippet.split("\n")[:14]
        return "=== CURRENT TASK (from HANDOFF.md) ===\n" + "\n".join(lines) + "\n"
    except Exception:
        return ""


def get_tracker_progress() -> str:
    """Extract sprint progress line from TRACKER.md."""
    try:
        if not TRACKER_FILE.exists():
            return ""
        content = TRACKER_FILE.read_text(encoding="utf-8")
        for line in content.split("\n")[:30]:
            stripped = line.strip()
            if ("/" in stripped and "✅" in stripped) or "Прогрес" in stripped:
                return f"SPRINT PROGRESS: {stripped}\n"
        return ""
    except Exception:
        return ""


STARTUP_PROTOCOL = """\
=== MANDATORY SESSION STARTUP — execute before anything else ===

STEP 1: Call mcp__mempalace__mempalace_status (tool call, not just mention)
STEP 2: Read XDEV/MAPS/SYSTEM_MAP.md (last 50 lines, offset mode)
STEP 3: Write in your first response: "STARTUP OK: Palace [N drawers] | SYSTEM_MAP current | Ready"

CRITICAL: No file reads for tasks, no code, no answers until STARTUP OK is confirmed.
This is IRON RULE -1. It cannot be skipped, deferred, or abbreviated.
"""


def main() -> int:
    reset_session_state()

    graphify_ctx   = get_graphify_summary()
    current_task   = get_current_task()
    tracker_prog   = get_tracker_progress()

    parts = []
    if graphify_ctx:
        parts.append(graphify_ctx)
    if tracker_prog:
        parts.append(tracker_prog)
    if current_task:
        parts.append(current_task)
    parts.append(STARTUP_PROTOCOL)

    full_context = "\n".join(parts)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": full_context
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
