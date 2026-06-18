#!/usr/bin/env python3
"""
POST_EDIT_HOOK — PostToolUse (Edit|Write):
- Triggers graphify file tracking
- AUTO-RUNS npx tsc --noEmit for TypeScript files and injects result
- Prints post-change protocol reminder for .ts/.tsx files
"""
import sys
import json
import subprocess
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
BOOKIT_DIR = Path("C:/Users/Vitossik/SaaS/bookit")
AUTO_TSC_DISABLED = True  # disabled: 60s block per edit is too expensive; run manually


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


def run_tsc_auto() -> str:
    """Auto-run npx tsc --noEmit and return result string."""
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            cwd=str(BOOKIT_DIR),
            capture_output=True,
            text=True,
            timeout=60,
            shell=True,
        )
        if result.returncode == 0:
            return "AUTO-TSC: 0 errors ✅"
        else:
            output = (result.stdout + result.stderr).strip()
            # Trim to avoid flooding context
            if len(output) > 600:
                output = output[:600] + "\n... (truncated)"
            return f"AUTO-TSC FAILED ❌ — fix before continuing:\n{output}"
    except subprocess.TimeoutExpired:
        return "AUTO-TSC: timeout (>60s) — run manually"
    except Exception as e:
        return f"AUTO-TSC: could not run ({e})"


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
            # Mark TS files as "edited since tsc" for TSC gate
            if Path(file_path).suffix in TS_EXTENSIONS:
                try:
                    if STATE_FILE.exists():
                        s = json.loads(STATE_FILE.read_text(encoding="utf-8"))
                    else:
                        s = {}
                    s["ts_edited_since_tsc"] = True
                    STATE_FILE.write_text(json.dumps(s, ensure_ascii=False, indent=2), encoding="utf-8")
                except Exception:
                    pass

        # Post-change protocol — TypeScript files only
        if file_path and Path(file_path).suffix in TS_EXTENSIONS:
            fname = Path(file_path).name

            # Auto-run TSC
            tsc_result = (
                "AUTO-TSC: disabled — run manually: npx tsc --noEmit"
                if AUTO_TSC_DISABLED
                else run_tsc_auto()
            )

            context = (
                f"[POST-CHANGE] {fname} was just modified. "
                f"{tsc_result} | "
                "Remaining mandatory steps: "
                "1) npm run build (before deploy only); "
                "2) mempalace_add_drawer — save key decisions; "
                "3) SYSTEM_MAP if new routes/components added; "
                "4) Sprint pipeline: TRACKER✅ → HANDOFF → TRANSITION → docs commit. "
                "Do NOT mark task complete until all done."
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
