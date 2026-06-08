#!/usr/bin/env python3
"""
SESSION_START_HOOK — SessionStart event: fires at the very beginning of every session.
Injects mandatory startup protocol + graphify hot-files summary into model context.
Also resets edit counter + read tracker state files for fresh session.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Reset session state (edit_counter_guard + read_limit_hook)
try:
    state_file = Path(__file__).parent / "state" / "session_state.json"
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(
        json.dumps({"edit_counts": {}, "consecutive_reads": 0, "read_files": []}, indent=2),
        encoding="utf-8"
    )
except Exception:
    pass


def get_graphify_summary():
    """Return top-10 most edited files from graph-index.json, or empty string."""
    try:
        graph_path = Path("C:/Users/Vitossik/SaaS/graphify-out/graph-index.json")
        if not graph_path.exists():
            return ""
        index = json.loads(graph_path.read_text(encoding="utf-8"))
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
        lines.append(f"  (total tracked: {len(files)} files | {index.get('total_edits', 0)} edits | {index.get('total_searches', 0)} searches)")
        lines.append("")
        return "\n".join(lines)
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

graphify_ctx = get_graphify_summary()
full_context = (graphify_ctx + "\n" + STARTUP_PROTOCOL) if graphify_ctx else STARTUP_PROTOCOL

output = {
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": full_context
    }
}

print(json.dumps(output, ensure_ascii=False))
