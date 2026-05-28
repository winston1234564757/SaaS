#!/usr/bin/env python3
"""
SESSION_START_HOOK — SessionStart event: fires at the very beginning of every session.
Injects mandatory startup protocol into model context via additionalContext.
"""
import sys
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STARTUP_PROTOCOL = """\
=== MANDATORY SESSION STARTUP — execute before anything else ===

STEP 1: Call mcp__mempalace__mempalace_status (tool call, not just mention)
STEP 2: Read XDEV/MAPS/SYSTEM_MAP.md (last 50 lines, offset mode)
STEP 3: Write in your first response: "STARTUP OK: Palace [N drawers] | SYSTEM_MAP current | Ready"

CRITICAL: No file reads for tasks, no code, no answers until STARTUP OK is confirmed.
This is IRON RULE -1. It cannot be skipped, deferred, or abbreviated.
"""

output = {
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": STARTUP_PROTOCOL
    }
}

print(json.dumps(output, ensure_ascii=False))
