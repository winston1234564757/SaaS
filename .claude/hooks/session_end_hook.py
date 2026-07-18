#!/usr/bin/env python3
"""
SESSION_END_HOOK v1.0 — SessionEnd event.
Fires ONCE when the session actually closes (not after every response like Stop).

Responsibilities:
  D. Auto-commit uncommitted tracked files
  E. Auto vercel --prod after successful commit
"""
import sys
import json
import subprocess
from pathlib import Path
from datetime import date

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"
REPO_DIR   = Path(__file__).resolve().parents[2]
BOOKIT_DIR = (Path(__file__).resolve().parents[2] / "bookit")
TRACKER_FILE = (Path(__file__).resolve().parents[2] / "XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def run_cmd(args: list[str], cwd: str, timeout: int = 30) -> tuple[int, str]:
    try:
        r = subprocess.run(
            args, cwd=cwd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=timeout, shell=True,
        )
        return r.returncode, (r.stdout + r.stderr).strip()
    except subprocess.TimeoutExpired:
        return 1, "timeout"
    except Exception as e:
        return 1, str(e)


def get_current_task_label() -> str:
    try:
        if not TRACKER_FILE.exists():
            return "session-end"
        content = TRACKER_FILE.read_text(encoding="utf-8", errors="replace")
        for line in content.split("\n"):
            if "🔄" in line or ("T" in line and "▶" in line):
                parts = [p.strip() for p in line.split("|") if p.strip()]
                for p in parts:
                    if p.startswith("T") and len(p) <= 4:
                        return p.lower()
    except Exception:
        pass
    return "session-end"


def auto_commit(task_label: str) -> tuple[bool, str]:
    code, git_status = run_cmd(["git", "status", "--short"], str(REPO_DIR))
    if not git_status.strip():
        return False, "nothing to commit"

    code, tracked = run_cmd(
        ["git", "diff", "--name-only", "--diff-filter=M"],
        str(REPO_DIR)
    )
    tracked_files = [f.strip() for f in tracked.splitlines() if f.strip()] if code == 0 else []
    if not tracked_files:
        return False, "no tracked modified files"

    run_cmd(["git", "add"] + tracked_files, str(REPO_DIR))

    today = date.today().isoformat()
    file_names = [Path(f).name for f in tracked_files[:4]]
    files_str = ", ".join(file_names)
    if len(tracked_files) > 4:
        files_str += f" (+{len(tracked_files) - 4} more)"

    msg = (
        f"chore({task_label}): session-end auto-commit {today}\n\n"
        f"Files: {files_str}\n\n"
        f"Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\n"
        f"Claude-Session: https://claude.ai/code/session_01JJYEtveyZnBQGJUske4im9"
    )

    code, out = run_cmd(["git", "commit", "-m", msg], str(REPO_DIR))
    if code == 0:
        run_cmd(["git", "push"], str(REPO_DIR))
        return True, f"committed {len(tracked_files)} file(s): {files_str}"
    return False, f"commit failed: {out[:200]}"


def auto_deploy() -> tuple[bool, str]:
    code, out = run_cmd(
        ["vercel", "--prod", "--yes"],
        str(BOOKIT_DIR),
        timeout=300,
    )
    if code == 0:
        for line in out.splitlines():
            if "vercel.app" in line:
                return True, f"deployed: {line.strip()}"
        return True, "deployed to production"
    return False, f"deploy failed: {out[:300]}"


def main() -> int:
    state      = load_state()
    modified   = state.get("edit_counts", {})
    has_edits  = bool(modified)
    qa_passed  = state.get("qa_gate_passed", False)

    lines = ["[SESSION END] Running auto-commit + deploy..."]

    if not has_edits:
        lines.append("No edits this session — skipping commit + deploy.")
        print(json.dumps({"systemMessage": "\n".join(lines)}, ensure_ascii=False))
        return 0

    task_label = get_current_task_label()

    committed, commit_msg = auto_commit(task_label)
    if committed:
        lines.append(f"Git: {commit_msg}")
        deployed, deploy_msg = auto_deploy()
        status = "OK" if deployed else "FAILED"
        lines.append(f"Vercel [{status}]: {deploy_msg}")
    else:
        lines.append(f"Git: {commit_msg} (already committed or nothing to stage)")
        lines.append("Vercel: skipped (no new commit)")

    print(json.dumps({"systemMessage": "\n".join(lines)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
