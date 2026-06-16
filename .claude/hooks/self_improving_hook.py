#!/usr/bin/env python3
"""
SELF_IMPROVING_HOOK v2.0 — Stop event.

ALWAYS: diary_write (step 0) — every session, even 0 edits.
If edits >= 1: add_drawer + self-improving-agent + sprint pipeline + deploy.
Mandatory threshold (detailed prompt): >= 3 edits.
"""
import sys
import json
import subprocess
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE   = Path(__file__).parent / "state" / "session_state.json"
REPO_DIR     = Path("C:/Users/Vitossik/SaaS")
BOOKIT_DIR   = Path("C:/Users/Vitossik/SaaS/bookit")
TRACKER_FILE = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")
HANDOFF_FILE = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md")
TRANSITION   = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRANSITION_PROMPT.md")
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
    try:
        if not STATE_FILE.exists():
            return []
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        ec = state.get("edit_counts", {})
        if isinstance(ec, dict):
            return [f for f in ec if f.endswith((".ts", ".tsx", ".py", ".json", ".md"))]
        return []
    except Exception:
        return []


def get_git_status() -> str:
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=str(REPO_DIR), capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=10, shell=True,
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        return ""


def get_recent_commits(n: int = 5) -> str:
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{n}"],
            cwd=str(REPO_DIR), capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=10, shell=True,
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        return ""


def main() -> int:
    total_edits    = get_session_edit_count()
    modified       = get_modified_files()
    recent_commits = get_recent_commits(5)
    git_status_out = get_git_status()
    has_edits      = total_edits >= 1
    mandatory      = total_edits >= EDIT_THRESHOLD

    lines = [f"SESSION END — {total_edits} change(s) detected.", ""]

    # Step 0: ALWAYS — diary write (even 0 edits)
    lines += [
        "STEP 0 [MANDATORY — every session]:",
        "  mcp__mempalace__mempalace_diary_write",
        "  Write 2-3 sentences: what was worked on | key decisions | what is next",
        "",
    ]

    if has_edits:
        files_section = ""
        if modified:
            flist = "\n".join(f"    - {f}" for f in modified[:10])
            files_section = f"\n  Modified files:\n{flist}"

        commits_section = ""
        if recent_commits:
            clist = "\n".join(f"    {ln}" for ln in recent_commits.split("\n")[:5])
            commits_section = f"\n  Recent commits:\n{clist}"

        pref = "MANDATORY" if mandatory else "RECOMMENDED"

        lines += [
            f"STEP 1 [{pref}]{files_section}{commits_section}",
            "  mcp__mempalace__mempalace_add_drawer — for each key technical decision",
            "",
            f"STEP 2 [{pref}]:",
            "  Skill(skill='self-improving-agent') with command='extract'",
            "",
            "STEP 3 [MANDATORY] — Sprint pipeline:",
            f"  TRACKER.md: {'OK' if TRACKER_FILE.exists() else 'MISSING'}  "
            f"HANDOFF.md: {'OK' if HANDOFF_FILE.exists() else 'MISSING'}  "
            f"TRANSITION.md: {'OK' if TRANSITION.exists() else 'MISSING'}",
            "  Mark completed tasks in TRACKER.md, update HANDOFF.md + TRANSITION_PROMPT.md",
            "",
        ]

        if git_status_out:
            lines += [
                "STEP 4 [MANDATORY] — Uncommitted changes detected:",
                git_status_out,
                "  Run: git add + git commit + git push, then vercel --prod from bookit/",
                "",
            ]
        else:
            lines += [
                "STEP 4 — no uncommitted changes.",
                "  Verify vercel --prod was run after last code commit.",
                "",
            ]

        ts_tsx = [f for f in modified if f.endswith((".ts", ".tsx"))]
        if ts_tsx:
            lines += [
                "STEP 5 — SYSTEM_MAP.md: new routes/components/hooks added? Update XDEV/MAPS/SYSTEM_MAP.md",
                "",
            ]

    lines.append("BLOCK: Do NOT finalize response until Step 0 diary_write is confirmed.")
    print(json.dumps({"systemMessage": "\n".join(lines)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
