#!/usr/bin/env python3
"""
STARTUP_GATE_HOOK — PreToolUse (Read|Glob|Grep|Edit|Write):
Blocks ALL file operations until startup protocol is confirmed:
  - mempalace_status called (mempalace_done: true)
  - SYSTEM_MAP.md read (systemmap_done: true)

Exit 0 = allow | Exit 2 = block
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"
# Sentinel: touch-file created when startup confirmed. Path.exists() = stat() only — no JSON parse.
SENTINEL_FILE = Path(__file__).parent / "state" / "startup_ok"

# Paths always allowed (needed for startup itself, hooks, config)
ALWAYS_ALLOW = [
    "SYSTEM_MAP",       # needed to complete startup step 2
    "XDEV/MAPS/",       # relevant maps read during startup step 3
    "XDEV/",            # all XDEV docs
    ".claude/",         # all claude config files (hooks, settings, skills, CLAUDE.md)
    "session_state",    # state file
    "HANDOFF.md",       # needed in some startup reads
    "TRACKER.md",       # sprint progress
    "TASK.md",          # active tasks
    "SPRINT-04",        # sprint docs
    "memory/",          # memory files
    "skillinstall",     # skill management
]


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def is_allowed_path(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return any(p in normalized for p in ALWAYS_ALLOW)


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))

        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "") or tool_input.get("path", "")

        # No file path — allow (e.g. Grep with pattern only)
        if not file_path:
            return 0

        # Always allow startup-critical paths
        if is_allowed_path(file_path):
            return 0

        # Fast-path: sentinel file is a single stat() — no JSON parse needed
        if SENTINEL_FILE.exists():
            return 0

        state = load_state()

        # Diagnose which step is missing
        mempalace_done = state.get("mempalace_done", False)
        systemmap_done = state.get("systemmap_done", False)

        missing = []
        if not mempalace_done:
            missing.append("STEP 1: Call mcp__mempalace__mempalace_status (tool call)")
        if not systemmap_done:
            missing.append("STEP 2: Read XDEV/MAPS/SYSTEM_MAP.md (offset: last 50 lines)")

        fname = Path(file_path).name
        msg = (
            f"\n[STARTUP GATE BLOCK] Cannot access '{fname}'\n"
            "Startup protocol not completed. Complete these steps first:\n\n"
            + "\n".join(f"  {s}" for s in missing)
            + "\n\nAfter both steps: write 'STARTUP OK: Palace [N] | SYSTEM_MAP current | Ready'\n"
            "The gate will unlock automatically once both tool calls are detected.\n"
        )
        print(msg)
        return 2

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
