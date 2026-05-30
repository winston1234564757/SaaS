#!/usr/bin/env python3
"""
POST_EDIT_HOOK — PostToolUse (Edit|Write):
- Triggers graphify file tracking
- Prints post-change protocol reminder for .ts/.tsx files
"""
import sys
import json
from pathlib import Path

# Force UTF-8 on Windows
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


def reset_consecutive_reads():
    """Reset read counter after every Write/Edit (the correct action was taken)."""
    try:
        if STATE_FILE.exists():
            state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        else:
            state = {"edit_counts": {}, "consecutive_reads": 0, "read_files": []}
        state["consecutive_reads"] = 0
        state["read_files"] = []
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def main():
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8", errors="replace"))
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if file_path:
            track_file(file_path, tool_name.lower())
            reset_consecutive_reads()

        # Post-change protocol — inject into model context for TypeScript files
        if file_path and Path(file_path).suffix in TS_EXTENSIONS:
            fname = Path(file_path).name
            context = (
                f"[POST-CHANGE] {fname} was just modified. "
                "MANDATORY next steps before this task is considered done: "
                "1) run `npx tsc --noEmit` in bookit/ and confirm 0 errors; "
                "2) run `npm run build` to verify Next.js compilation; "
                "3) call mempalace_add_drawer to save technical decisions; "
                "4) update XDEV/MAPS/SYSTEM_MAP.md if new routes/components added. "
                "Do NOT mark task complete or move to the next task until these are done."
            )
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": context
                }
            }
            print(json.dumps(output, ensure_ascii=False))

    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
