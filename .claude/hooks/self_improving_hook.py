#!/usr/bin/env python3
"""
SELF_IMPROVING_HOOK v4.0 — Stop event.

v4.0 additions:
  D. Auto-commit uncommitted changes at session end (if qa_gate_passed + has edits)
  E. Auto vercel --prod if bookit .ts/.tsx files were changed

v3.0 features retained:
  A. Auto-generated diary draft from session state
  B. Protocol violation audit
  C. Conditional self-improving-agent (>= 5 edits + TS files)
"""
import sys
import json
import subprocess
from pathlib import Path
from datetime import date

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE   = Path(__file__).parent / "state" / "session_state.json"
REPO_DIR     = Path("C:/Users/Vitossik/SaaS")
BOOKIT_DIR   = Path("C:/Users/Vitossik/SaaS/bookit")
TRACKER_FILE = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")
HANDOFF_FILE = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md")
TRANSITION   = Path("C:/Users/Vitossik/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRANSITION_PROMPT.md")

EXTRACT_EDIT_THRESHOLD   = 5
MANDATORY_EDIT_THRESHOLD = 3


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def get_session_edit_count(state: dict) -> int:
    ec = state.get("edit_counts", {})
    return sum(ec.values()) if isinstance(ec, dict) else 0


def get_modified_files(state: dict) -> list[str]:
    ec = state.get("edit_counts", {})
    if isinstance(ec, dict):
        return [f for f in ec if f.endswith((".ts", ".tsx", ".py", ".json", ".md", ".sql"))]
    return []


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


def get_git_status() -> str:
    code, out = run_cmd(["git", "status", "--short"], str(REPO_DIR))
    return out if code == 0 else ""


def get_recent_commits(n: int = 5) -> str:
    code, out = run_cmd(["git", "log", "--oneline", f"-{n}"], str(REPO_DIR))
    return out if code == 0 else ""


def get_current_task_label() -> str:
    """Extract short task label from TRACKER.md for commit message."""
    try:
        if not TRACKER_FILE.exists():
            return "session-end"
        content = TRACKER_FILE.read_text(encoding="utf-8", errors="replace")
        for line in content.split("\n"):
            if "🔄" in line or ("T" in line and "▶" in line):
                # Extract T-id from line like "| T25 | ..."
                parts = [p.strip() for p in line.split("|") if p.strip()]
                for p in parts:
                    if p.startswith("T") and len(p) <= 4:
                        return p.lower()
        return "session-end"
    except Exception:
        return "session-end"


def auto_commit(modified: list[str], task_label: str) -> tuple[bool, str]:
    """D. Auto-commit tracked modified files."""
    git_status = get_git_status()
    if not git_status:
        return False, "nothing to commit"

    # Only stage already-tracked modified files (M prefix), not untracked (??)
    code, tracked = run_cmd(
        ["git", "diff", "--name-only", "--diff-filter=M"],
        str(REPO_DIR)
    )
    tracked_files = [f.strip() for f in tracked.splitlines() if f.strip()] if code == 0 else []

    if not tracked_files:
        return False, "no tracked modified files to commit"

    # Stage tracked modified files
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
    """E. Auto vercel --prod from bookit/."""
    code, out = run_cmd(
        ["vercel", "--prod", "--yes"],
        str(BOOKIT_DIR),
        timeout=180,
    )
    if code == 0:
        # Extract deploy URL from output
        for line in out.splitlines():
            if "bookit" in line and "vercel.app" in line:
                return True, f"deployed: {line.strip()}"
        return True, "deployed to production"
    return False, f"deploy failed: {out[:300]}"


def build_protocol_audit(state: dict) -> list[str]:
    startup   = state.get("startup_confirmed", False)
    qa        = state.get("qa_gate_passed", False)
    tsc_dirty = state.get("ts_edited_since_tsc", False)
    searched  = state.get("mempalace_searched", False)

    violations = []
    if not startup:
        violations.append("  startup protocol skipped (mempalace_status or SYSTEM_MAP not confirmed)")
    if not qa:
        violations.append("  QA gate not passed (grill-me / brainstorming never called)")
    if tsc_dirty:
        violations.append("  TypeScript edited but tsc --noEmit not run after last edit")
    if not searched:
        violations.append("  mempalace_search never called this session")

    lines = ["PROTOCOL AUDIT:"]
    lines.append(f"  startup_confirmed:    {'OK' if startup else 'SKIPPED'}")
    lines.append(f"  qa_gate_passed:       {'OK' if qa else 'SKIPPED'}")
    lines.append(f"  ts_edited_since_tsc:  {'WARN — tsc not run' if tsc_dirty else 'clean'}")
    lines.append(f"  mempalace_searched:   {'OK' if searched else 'SKIPPED'}")

    if violations:
        lines.append("")
        lines.append("  VIOLATIONS THIS SESSION:")
        lines.extend(violations)
        lines.append("  Note in diary_write so next session improves.")
    return lines


def build_diary_draft(state: dict, modified: list[str], skills_called: list[str]) -> list[str]:
    today      = date.today().isoformat()
    file_names = [Path(f).name for f in modified[:6]]
    files_str  = ", ".join(file_names) if file_names else "no files"
    skills_str = ", ".join(skills_called) if skills_called else "none"
    qa_str     = "passed" if state.get("qa_gate_passed") else "skipped"

    return [
        "DIARY DRAFT (fill <...> before calling diary_write):",
        f"  date: {today}",
        f"  files_changed: [{files_str}]",
        f"  skills_called: [{skills_str}]",
        f"  qa_gate: {qa_str}",
        '  summary: "<what was built/fixed — 1 sentence>"',
        '  decisions: "<key technical choice — 1 sentence>"',
        '  next: "<what next task requires — 1 sentence>"',
        "",
        "  Call: mcp__mempalace__mempalace_diary_write with filled text above.",
    ]


def main() -> int:
    state          = load_state()
    total_edits    = get_session_edit_count(state)
    modified       = get_modified_files(state)
    skills_called  = state.get("skills_called", [])
    qa_passed      = state.get("qa_gate_passed", False)
    recent_commits = get_recent_commits(5)

    has_edits    = total_edits >= 1
    mandatory    = total_edits >= MANDATORY_EDIT_THRESHOLD
    run_extract  = (
        total_edits >= EXTRACT_EDIT_THRESHOLD
        and any(f.endswith((".ts", ".tsx")) for f in modified)
    )
    has_bookit_ts = any(
        "bookit" in f and f.endswith((".ts", ".tsx")) for f in modified
    )

    lines = [
        f"SESSION END — {total_edits} change(s) | {len(modified)} file(s) | "
        f"skills: {len(skills_called)} | qa: {'OK' if qa_passed else 'SKIPPED'}",
        "",
    ]

    # B. Protocol audit — always
    lines += build_protocol_audit(state)
    lines.append("")

    # A. Diary draft — always (Step 0)
    lines += ["STEP 0 [MANDATORY — every session]:"]
    lines += build_diary_draft(state, modified, skills_called)
    lines.append("")

    if has_edits:
        files_section = ""
        if modified:
            flist = "\n".join(f"    - {Path(f).name}" for f in modified[:10])
            files_section = f"\n  Files:\n{flist}"

        commits_section = ""
        if recent_commits:
            clist = "\n".join(f"    {ln}" for ln in recent_commits.split("\n")[:5])
            commits_section = f"\n  Recent commits:\n{clist}"

        pref = "MANDATORY" if mandatory else "RECOMMENDED"
        lines += [
            f"STEP 1 [{pref}]{files_section}{commits_section}",
            "  mcp__mempalace__mempalace_add_drawer — one drawer per key technical decision",
            "",
        ]

        # C. Conditional self-improving
        if run_extract:
            lines += [
                "STEP 2 [MANDATORY — >= 5 edits + TS files changed]:",
                "  Skill(skill='self-improving-agent') with command='extract'",
                "",
            ]
        else:
            lines += [
                f"STEP 2 [SKIPPED — {total_edits} edits / threshold: {EXTRACT_EDIT_THRESHOLD}]",
                "",
            ]

        lines += [
            "STEP 3 [MANDATORY] — Sprint pipeline:",
            f"  TRACKER.md: {'OK' if TRACKER_FILE.exists() else 'MISSING'}  "
            f"HANDOFF.md: {'OK' if HANDOFF_FILE.exists() else 'MISSING'}  "
            f"TRANSITION.md: {'OK' if TRANSITION.exists() else 'MISSING'}",
            "  Mark completed tasks, update HANDOFF.md + TRANSITION_PROMPT.md",
            "",
        ]

        # D. Auto-commit
        task_label = get_current_task_label()
        committed, commit_msg = auto_commit(modified, task_label)
        if committed:
            lines += [
                f"STEP 4 [AUTO-DONE] — Git: {commit_msg}",
                "",
            ]
            # E. Auto-deploy (only if bookit TS files changed + commit succeeded)
            if has_bookit_ts:
                deployed, deploy_msg = auto_deploy()
                status = "AUTO-DONE" if deployed else "FAILED"
                lines += [
                    f"STEP 5 [AUTO-{status}] — Vercel: {deploy_msg}",
                    "",
                ]
            else:
                lines += [
                    "STEP 5 [SKIPPED] — Vercel: no bookit .ts/.tsx changes detected",
                    "",
                ]
        else:
            lines += [
                f"STEP 4 [AUTO-SKIPPED] — Git: {commit_msg}",
                "  If manual commit needed: git add <files> && git commit && git push",
                "",
                "STEP 5 [SKIPPED] — Vercel: depends on Step 4",
                "",
            ]

        ts_tsx = [f for f in modified if f.endswith((".ts", ".tsx"))]
        if ts_tsx:
            lines += [
                "STEP 6 — SYSTEM_MAP.md: new routes/components/hooks? Update XDEV/MAPS/SYSTEM_MAP.md",
                "",
            ]

    lines.append("Do NOT finalize until diary_write (Step 0) is confirmed.")
    print(json.dumps({"systemMessage": "\n".join(lines)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
