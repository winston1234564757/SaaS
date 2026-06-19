#!/usr/bin/env python3
"""
STARTUP_TRACKER_HOOK — PostToolUse (all tools):
Detects mempalace_status call + SYSTEM_MAP.md read → sets startup_confirmed flag.
Once both are done, unlocks all further Read/Edit/Write operations.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def save_state(state: dict):
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))

        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})

        state = load_state()
        changed = False

        # Step 1: detect mempalace_status call
        if tool_name == "mcp__mempalace__mempalace_status":
            if not state.get("mempalace_done"):
                state["mempalace_done"] = True
                changed = True

        # Step 2: detect SYSTEM_MAP.md read
        if tool_name == "Read":
            file_path = tool_input.get("file_path", "")
            if "SYSTEM_MAP" in file_path:
                if not state.get("systemmap_done"):
                    state["systemmap_done"] = True
                    changed = True

        # Track mempalace_search for task gate
        if tool_name == "mcp__mempalace__mempalace_search":
            if not state.get("mempalace_searched"):
                state["mempalace_searched"] = True
                changed = True

        # Track tsc run — resets batch counter
        if tool_name == "Bash":
            cmd = tool_input.get("command", "")
            if "tsc" in cmd and "--noEmit" in cmd:
                if state.get("ts_edits_since_tsc", 0) > 0:
                    state["ts_edits_since_tsc"] = 0
                    changed = True

        # Confirm startup when both steps done — record date for same-day persistence
        if state.get("mempalace_done") and state.get("systemmap_done"):
            if not state.get("startup_confirmed"):
                import datetime
                state["startup_confirmed"] = True
                state["startup_date"] = datetime.date.today().isoformat()
                changed = True
                # Create sentinel file — startup_gate_hook uses stat() instead of JSON parse
                try:
                    SENTINEL = STATE_FILE.parent / "startup_ok"
                    SENTINEL.parent.mkdir(parents=True, exist_ok=True)
                    SENTINEL.touch()
                except Exception:
                    pass

        if changed:
            save_state(state)

    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
