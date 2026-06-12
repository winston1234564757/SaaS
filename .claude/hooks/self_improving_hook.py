#!/usr/bin/env python3
"""
SELF_IMPROVING_HOOK — Stop event.

If >= 3 edits were made this session:
1. Inject systemMessage with MANDATORY session-end protocol
2. Include git log of recent commits to help Claude populate mempalace
3. List modified TS files for SYSTEM_MAP check
"""
import sys
import json
import subprocess
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE = Path(__file__).parent / "state" / "session_state.json"
REPO_DIR = Path("C:/Users/Vitossik/SaaS")
EDIT_THRESHOLD = 3


def get_session_edit_count() -> int:
    try:
        if not STATE_FILE.exists():
            return 0
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        edit_counts = state.get("edit_counts", {})
        if isinstance(edit_counts, dict):
            return sum(edit_counts.values())
        return 0
    except Exception:
        return 0


def get_modified_files() -> list[str]:
    """Get list of TS/TSX files changed this session via edit_counts."""
    try:
        if not STATE_FILE.exists():
            return []
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        edit_counts = state.get("edit_counts", {})
        if isinstance(edit_counts, dict):
            return [f for f in edit_counts if f.endswith((".ts", ".tsx"))]
        return []
    except Exception:
        return []


def get_recent_commits(n: int = 5) -> str:
    """Get last N git commits for this session context."""
    try:
        result = subprocess.run(
            ["git", "log", f"--oneline", f"-{n}"],
            cwd=str(REPO_DIR),
            capture_output=True,
            text=True,
            timeout=10,
            shell=True,
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        return ""


def main() -> int:
    total_edits = get_session_edit_count()

    if total_edits >= EDIT_THRESHOLD:
        modified_files = get_modified_files()
        recent_commits = get_recent_commits(5)

        files_section = ""
        if modified_files:
            files_list = "\n".join(f"  - {f}" for f in modified_files[:10])
            files_section = f"\nModified TS files this session:\n{files_list}"

        commits_section = ""
        if recent_commits:
            commits_section = f"\nRecent commits (use for mempalace content):\n{recent_commits}"

        msg = (
            f"SESSION END — {total_edits} code changes detected."
            f"{files_section}"
            f"{commits_section}\n\n"
            "MANDATORY SESSION-END PROTOCOL (execute ALL steps NOW):\n"
            "1. mempalace_add_drawer — for EACH key technical decision made this session "
            "(use modified files + commits above as reference).\n"
            "2. Skill(skill='self-improving-agent') — invoke to extract reusable patterns.\n"
            "3. Check XDEV/MAPS/SYSTEM_MAP.md — update if new routes/components/hooks added.\n"
            "4. Sprint pipeline complete? TRACKER✅ + HANDOFF + TRANSITION + docs commit.\n"
            "BLOCK: Do NOT output final response until steps 1-4 confirmed."
        )
        print(json.dumps({"systemMessage": msg}, ensure_ascii=False))
    else:
        print(json.dumps({}, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    sys.exit(main())
