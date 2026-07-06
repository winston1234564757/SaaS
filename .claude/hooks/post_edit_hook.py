#!/usr/bin/env python3
"""
POST_EDIT_HOOK — PostToolUse (Edit|Write):
- Triggers graphify file tracking
- Increments TS batch counter (feeds tsc_gate_hook)
- Warns when approaching TSC gate limit (last 2 edits before block)
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).parent))
try:
    from graphify_hook import track_file
except ImportError:
    def track_file(f, t):
        return True

TS_EXTENSIONS = {".ts", ".tsx"}
STATE_FILE = Path(__file__).parent / "state" / "session_state.json"

MAX_TS_EDITS_BEFORE_TSC = 8  # warn threshold before requiring tsc run


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {"edit_counts": {}, "consecutive_reads": 0, "read_files": []}


def save_state(state: dict):
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def main():
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})
        tool_name = data.get("tool_name", "")
        file_path = tool_input.get("file_path", "")

        if not file_path:
            return 0

        track_file(file_path, tool_name.lower())

        # Single read-modify-write for all state updates (avoids TOCTOU double-write)
        state = load_state()
        state["consecutive_reads"] = 0
        state["read_files"] = []

        is_ts = Path(file_path).suffix in TS_EXTENSIONS
        if is_ts:
            count = state.get("ts_edits_since_tsc", 0) + 1
            state["ts_edits_since_tsc"] = count
            save_state(state)

            # Only warn when 1-2 edits remain before gate blocks
            if count >= MAX_TS_EDITS_BEFORE_TSC - 1:
                urgent = count >= MAX_TS_EDITS_BEFORE_TSC - 1
                msg = (
                    f"[TSC BATCH] {count}/{MAX_TS_EDITS_BEFORE_TSC} TS edits since last tsc. "
                    + ("Run tsc NOW — next edit will be blocked. " if urgent else "Run tsc soon. ")
                    + "Bash: cd C:/Users/Vitos/SaaS/bookit && npx tsc --noEmit"
                )
                print(json.dumps({
                    "hookSpecificOutput": {
                        "hookEventName": "PostToolUse",
                        "additionalContext": msg
                    }
                }, ensure_ascii=False))
        else:
            save_state(state)

    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
