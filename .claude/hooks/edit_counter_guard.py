#!/usr/bin/env python3
"""
EDIT_COUNTER_GUARD — PreToolUse (Edit|Write):
- Edit: tracks how many times each file is edited per session.
  Warns at 3, blocks at 5. Enforces RULE 5: ≥5 changes = Write.
- Write: resets the counter for that file (correct action, encouraged).
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"
WARN_AT = 3
BLOCK_AT = 5


def load_state():
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {"edit_counts": {}, "consecutive_reads": 0}


def save_state(state):
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def main():
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8-sig", errors="replace"))
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if not file_path:
            return 0

        state = load_state()
        counts = state.setdefault("edit_counts", {})

        # Write = correct action: reset counter for this file, encourage
        if tool_name == "Write":
            if file_path in counts and counts[file_path] > 0:
                print(f"[EDIT COUNTER] Write on {Path(file_path).name} — counter reset (was {counts[file_path]} edits). RULE 5 followed.")
            counts[file_path] = 0
            save_state(state)
            return 0

        # Edit = check threshold
        current = counts.get(file_path, 0)

        if current >= BLOCK_AT:
            print(f"[EDIT COUNTER GUARD] BLOCKED: {Path(file_path).name}")
            print(f"  Edits this session: {current}. RULE 5 requires Write at ≥{BLOCK_AT}.")
            print(f"  Action: Use Write tool with full file content instead.")
            print(f"  Manual reset: delete .claude/hooks/state/session_state.json")
            return 2  # block

        counts[file_path] = current + 1
        save_state(state)

        if current + 1 == WARN_AT:
            print(f"[EDIT COUNTER] WARNING {Path(file_path).name}: {current+1}/{BLOCK_AT} edits.")
            print(f"  Plan remaining changes — at {BLOCK_AT} edits this file will be blocked. Use Write instead.")
        elif current + 1 == BLOCK_AT - 1:
            print(f"[EDIT COUNTER] FINAL WARNING {Path(file_path).name}: {current+1}/{BLOCK_AT} edits. NEXT EDIT BLOCKED.")

        return 0

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
