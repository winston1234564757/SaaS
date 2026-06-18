#!/usr/bin/env python3
"""
SELF_IMPROVING_HOOK v3.0 — Stop event.

Improvements v3.0:
  A. Auto-generated diary draft from session state (files, skills, qa status)
  B. Protocol violation audit (startup / qa_gate / tsc)
  C. Conditional self-improving-agent: only if >= 5 edits AND .ts/.tsx changed
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

EXTRACT_EDIT_THRESHOLD  = 5   # minimum edits to trigger self-improving-agent
MANDATORY_EDIT_THRESHOLD = 3  # minimum edits for MANDATORY label on add_drawer


def load_state() -> dict:
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def get_session_edit_count(state: dict) -> int:
    edit_counts = state.get("edit_counts", {})
    if isinstance(edit_counts, dict):
        return sum(edit_counts.values())
    return 0


def get_modified_files(state: dict) -> list[str]:
    ec = state.get("edit_counts", {})
    if isinstance(ec, dict):
        return [f for f in ec if f.endswith((".ts", ".tsx", ".py", ".json", ".md", ".sql"))]
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


def build_protocol_audit(state: dict) -> list[str]:
    """B. Protocol violation audit."""
    startup  = state.get("startup_confirmed", False)
    qa       = state.get("qa_gate_passed", False)
    tsc_dirty = state.get("ts_edited_since_tsc", False)
    searched = state.get("mempalace_searched", False)

    def mark(ok: bool, warn: bool = False) -> str:
        if ok:
            return "OK"
        return "WARN" if warn else "SKIPPED"

    violations = []
    if not startup:
        violations.append("  startup protocol was skipped (mempalace_status or SYSTEM_MAP not confirmed)")
    if not qa:
        violations.append("  QA gate was not passed (grill-me / brainstorming never called)")
    if tsc_dirty:
        violations.append("  TypeScript files edited but tsc --noEmit not run after last edit")
    if not searched:
        violations.append("  mempalace_search was never called this session")

    lines = ["PROTOCOL AUDIT:"]
    lines.append(f"  startup_confirmed:    {'OK' if startup else 'SKIPPED'}")
    lines.append(f"  qa_gate_passed:       {'OK' if qa else 'SKIPPED'}")
    lines.append(f"  ts_edited_since_tsc:  {'WARN — tsc not run' if tsc_dirty else 'clean'}")
    lines.append(f"  mempalace_searched:   {'OK' if searched else 'SKIPPED'}")

    if violations:
        lines.append("")
        lines.append("  VIOLATIONS THIS SESSION:")
        lines.extend(violations)
        lines.append("  Note these in diary_write so next session improves.")

    return lines


def build_diary_draft(state: dict, modified: list[str], skills_called: list[str]) -> list[str]:
    """A. Auto-generated diary draft template."""
    today = date.today().isoformat()
    file_names = [Path(f).name for f in modified[:6]]
    files_str  = ", ".join(file_names) if file_names else "no files"
    skills_str = ", ".join(skills_called) if skills_called else "none"
    qa_str     = "passed" if state.get("qa_gate_passed") else "skipped"

    lines = [
        "DIARY DRAFT (fill in <...> before calling diary_write):",
        f'  date: {today}',
        f'  files_changed: [{files_str}]',
        f'  skills_called: [{skills_str}]',
        f'  qa_gate: {qa_str}',
        '  summary: "<what was built/fixed — 1 sentence>"',
        '  decisions: "<key technical choice made — 1 sentence>"',
        '  next: "<what T25/next task requires — 1 sentence>"',
        "",
        "  Call: mcp__mempalace__mempalace_diary_write with the filled text above.",
    ]
    return lines


def main() -> int:
    state         = load_state()
    total_edits   = get_session_edit_count(state)
    modified      = get_modified_files(state)
    skills_called = state.get("skills_called", [])
    recent_commits = get_recent_commits(5)
    git_status_out = get_git_status()

    has_edits     = total_edits >= 1
    mandatory     = total_edits >= MANDATORY_EDIT_THRESHOLD
    run_extract   = total_edits >= EXTRACT_EDIT_THRESHOLD and any(
        f.endswith((".ts", ".tsx")) for f in modified
    )

    lines = [f"SESSION END — {total_edits} change(s) | {len(modified)} file(s) | skills: {len(skills_called)}", ""]

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
                f"STEP 2 [SKIPPED — only {total_edits} edits / no TS changes; threshold: {EXTRACT_EDIT_THRESHOLD}]",
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

        if git_status_out:
            lines += [
                "STEP 4 [MANDATORY] — Uncommitted changes:",
                git_status_out,
                "  git add <files> && git commit && git push && vercel --prod (from bookit/)",
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
                "STEP 5 — SYSTEM_MAP.md: new routes/components/hooks? Update XDEV/MAPS/SYSTEM_MAP.md",
                "",
            ]

    lines.append("Do NOT finalize until diary_write (Step 0) is confirmed.")
    print(json.dumps({"systemMessage": "\n".join(lines)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
