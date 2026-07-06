#!/usr/bin/env python3
"""
SELF_IMPROVING_HOOK v5.0 — Stop event (lightweight).

Runs after EVERY response — must be fast (no git/vercel operations).
  A. Protocol violation audit
  B. Diary draft prompt (fill + call diary_write)
  C. Conditional self-improving-agent hint (>= 5 edits + TS files)
  D. Sprint pipeline reminder (TRACKER / HANDOFF / TRANSITION)

Auto-commit + vercel deploy -> session_end_hook.py (SessionEnd, fires once on close).
"""
import sys
import json
from pathlib import Path
from datetime import date

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STATE_FILE   = Path(__file__).parent / "state" / "session_state.json"
TRACKER_FILE = Path("C:/Users/Vitos/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")
HANDOFF_FILE = Path("C:/Users/Vitos/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md")
TRANSITION   = Path("C:/Users/Vitos/SaaS/XDEV/PLANS/SPRINT-04-BACKLOG/TRANSITION_PROMPT.md")

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


def get_modified_files(state: dict) -> list:
    ec = state.get("edit_counts", {})
    if isinstance(ec, dict):
        return [f for f in ec if f.endswith((".ts", ".tsx", ".py", ".json", ".md", ".sql"))]
    return []


def build_protocol_audit(state: dict) -> list:
    startup   = state.get("startup_confirmed", False)
    qa        = state.get("qa_gate_passed", False)
    tsc_dirty = state.get("ts_edited_since_tsc", False)
    searched  = state.get("mempalace_searched", False)

    violations = []
    if not startup:
        violations.append("  startup protocol skipped (mempalace_status or SYSTEM_MAP not confirmed)")
    if not qa:
        violations.append("  QA gate not passed (no skill invoked before editing)")
    if tsc_dirty:
        violations.append("  TypeScript edited but tsc --noEmit not run after last edit")
    if not searched:
        violations.append("  mempalace_search never called this session")

    lines = ["PROTOCOL AUDIT:"]
    lines.append(f"  startup_confirmed:   {'OK' if startup else 'SKIPPED'}")
    lines.append(f"  qa_gate_passed:      {'OK' if qa else 'SKIPPED'}")
    lines.append(f"  ts_edited_since_tsc: {'WARN — tsc not run' if tsc_dirty else 'clean'}")
    lines.append(f"  mempalace_searched:  {'OK' if searched else 'SKIPPED'}")

    if violations:
        lines.append("")
        lines.append("  VIOLATIONS THIS SESSION:")
        lines.extend(violations)
        lines.append("  Note in diary_write so next session improves.")
    return lines


def build_diary_draft(state: dict, modified: list, skills_called: list) -> list:
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
    state         = load_state()
    total_edits   = get_session_edit_count(state)
    modified      = get_modified_files(state)
    skills_called = state.get("skills_called", [])
    qa_passed     = state.get("qa_gate_passed", False)

    has_edits   = total_edits >= 1
    mandatory   = total_edits >= MANDATORY_EDIT_THRESHOLD
    run_extract = (
        total_edits >= EXTRACT_EDIT_THRESHOLD
        and any(f.endswith((".ts", ".tsx")) for f in modified)
    )

    lines = [
        f"TURN END -- {total_edits} edit(s) | {len(modified)} file(s) | "
        f"skills: {len(skills_called)} | qa: {'OK' if qa_passed else 'SKIPPED'}",
        "",
    ]

    lines += build_protocol_audit(state)
    lines.append("")

    lines += ["STEP 0 [MANDATORY -- every session]:"]
    lines += build_diary_draft(state, modified, skills_called)
    lines.append("")

    if has_edits:
        pref = "MANDATORY" if mandatory else "RECOMMENDED"
        if modified:
            flist = "\n".join(f"    - {Path(f).name}" for f in modified[:10])
            lines.append(f"STEP 1 [{pref}] -- mempalace_add_drawer:\n  Files:\n{flist}")
        else:
            lines.append(f"STEP 1 [{pref}] -- mempalace_add_drawer per key decision")
        lines.append("")

        if run_extract:
            lines += [
                "STEP 2 [MANDATORY -- >= 5 edits + TS]:",
                "  Skill(skill='self-improving-agent') command='extract'",
                "",
            ]
        else:
            ts_count = sum(1 for f in modified if f.endswith((".ts", ".tsx")))
            if total_edits < EXTRACT_EDIT_THRESHOLD:
                reason = f"{total_edits}/{EXTRACT_EDIT_THRESHOLD} edits"
            else:
                reason = f"no .ts/.tsx files ({ts_count} found)"
            lines += [f"STEP 2 [SKIPPED -- {reason}]", ""]

        lines += [
            "STEP 3 [MANDATORY] -- Sprint pipeline:",
            f"  TRACKER: {'OK' if TRACKER_FILE.exists() else 'MISSING'} | "
            f"HANDOFF: {'OK' if HANDOFF_FILE.exists() else 'MISSING'} | "
            f"TRANSITION: {'OK' if TRANSITION.exists() else 'MISSING'}",
            "  Mark tasks done, update HANDOFF.md + TRANSITION_PROMPT.md",
            "",
        ]

        ts_tsx = [f for f in modified if f.endswith((".ts", ".tsx"))]
        if ts_tsx:
            lines += ["STEP 4 -- SYSTEM_MAP.md: new routes/components/hooks? Update if yes.", ""]

    lines += [
        "STEPS 5-6 [AUTO on session close] -- git commit + vercel --prod via SessionEnd hook.",
        "Do NOT finalize until diary_write (Step 0) is confirmed.",
    ]
    print(json.dumps({"systemMessage": "\n".join(lines)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
