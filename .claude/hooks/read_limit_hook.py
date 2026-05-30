#!/usr/bin/env python3
"""
READ_LIMIT_HOOK — PreToolUse (Read):
Warns when too many consecutive Read calls happen without any Write/Edit.
Detects the "reading everything for context" anti-pattern (RULE 7).
Counter resets after each Write/Edit (see post_edit_hook.py).
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"
WARN_AT = 5    # Warn at 5 consecutive reads
HARD_AT = 8   # Strong warning at 8


def load_state():
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {"edit_counts": {}, "consecutive_reads": 0, "read_files": []}


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
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        state = load_state()
        consecutive = state.get("consecutive_reads", 0) + 1
        state["consecutive_reads"] = consecutive

        read_files = state.setdefault("read_files", [])
        fname = Path(file_path).name if file_path else "?"
        if file_path and fname not in read_files:
            read_files.append(fname)

        save_state(state)

        if consecutive == WARN_AT:
            print(f"[READ LIMIT] {consecutive} reads in a row without any Write/Edit.")
            print(f"  RULE 7: Read ONLY files you will change (files_changed = files_read).")
            print(f"  Read so far: {', '.join(read_files[-5:])}")
            print(f"  If these are all change targets — continue. If research reads — use Grep instead.")

        elif consecutive >= HARD_AT and consecutive % 2 == 0:
            print(f"[READ LIMIT] {consecutive} consecutive reads! RULE 7 violation likely.")
            print(f"  You've read: {', '.join(read_files[-8:])}")
            print(f"  Each read that won't result in a Write is wasted tokens.")

        return 0  # Never block — only warn

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
