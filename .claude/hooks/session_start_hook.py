#!/usr/bin/env python3
"""
SESSION_START_HOOK v2.0 — SessionStart event.
Fires at the very beginning of every session.

Injects:
  1. Graphify hot-files summary (top-10 most active)
  2. Current sprint task from HANDOFF.md (▶ NEXT section)
  3. Sprint progress from TRACKER.md
  4. Mandatory startup protocol (RULE -1)

Also resets session state (edit_counter + read_tracker).
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

GRAPH_INDEX   = (Path(__file__).resolve().parents[2] / "graphify-out/graph-index.json")
HANDOFF_FILE  = (Path(__file__).resolve().parents[2] / "XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md")
TRACKER_FILE  = (Path(__file__).resolve().parents[2] / "XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md")
STATE_FILE    = Path(__file__).parent / "state" / "session_state.json"


def reset_session_state():
    import datetime
    today = datetime.date.today().isoformat()
    try:
        # Preserve startup_confirmed if already done today (survives compaction mid-session)
        existing = {}
        if STATE_FILE.exists():
            try:
                existing = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        already_confirmed_today = (
            existing.get("startup_confirmed") and
            existing.get("startup_date") == today
        )
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        sentinel = STATE_FILE.parent / "startup_ok"
        if not already_confirmed_today:
            try:
                sentinel.unlink(missing_ok=True)
            except Exception:
                pass
        elif not sentinel.exists():
            try:
                sentinel.touch()
            except Exception:
                pass
        STATE_FILE.write_text(
            json.dumps({
                "edit_counts": {},
                "consecutive_reads": 0,
                "read_files": [],
                "qa_gate_passed": False,
                "skills_called": [],
                # Startup gate — persist within same calendar day (survives compaction)
                "startup_confirmed": already_confirmed_today,
                "mempalace_done": already_confirmed_today,
                "systemmap_done": already_confirmed_today,
                "startup_date": today,
                # Task gate
                "mempalace_searched": False,
                # TSC batch counter (reset per session)
                "ts_edits_since_tsc": 0,
            }, indent=2),
            encoding="utf-8"
        )
    except Exception:
        pass


def get_graphify_summary() -> str:
    try:
        if not GRAPH_INDEX.exists():
            return ""
        index = json.loads(GRAPH_INDEX.read_text(encoding="utf-8"))
        files = index.get("files", {})
        if not files:
            return ""
        scored = [
            (p, d["writes"], d["searches"], d.get("reads", 0))
            for p, d in files.items()
            if d["writes"] >= 2 or d["searches"] >= 5
        ]
        scored.sort(key=lambda x: x[1] * 3 + x[2], reverse=True)
        top = scored[:10]
        if not top:
            return ""
        lines = ["=== GRAPHIFY — HOT FILES (most active this project) ==="]
        for path, writes, searches, reads in top:
            name = Path(path).name
            lines.append(f"  {name}: {writes}w {searches}s {reads}r  [{path}]")
        lines.append(
            f"  (total tracked: {len(files)} files | "
            f"{index.get('total_edits', 0)} edits | "
            f"{index.get('total_searches', 0)} searches)"
        )
        lines.append("")
        return "\n".join(lines)
    except Exception:
        return ""


def get_current_task() -> tuple[str, str]:
    """Extract current task section from HANDOFF.md. Returns (formatted_output, raw_content)."""
    try:
        if not HANDOFF_FILE.exists():
            return "", ""
        content = HANDOFF_FILE.read_text(encoding="utf-8")
        for marker in ("▶ NEXT", "**▶", "Наступна задача:", "## ▶", "NEXT TASK"):
            idx = content.find(marker)
            if idx != -1:
                snippet = content[idx: idx + 700]
                lines = snippet.split("\n")[:14]
                return "=== CURRENT TASK (from HANDOFF.md) ===\n" + "\n".join(lines) + "\n", content
        lines = content.split("\n")[:10]
        return "=== HANDOFF (top) ===\n" + "\n".join(lines) + "\n", content
    except Exception:
        return "", ""


def get_tracker_progress() -> str:
    """Extract sprint progress line from TRACKER.md."""
    try:
        if not TRACKER_FILE.exists():
            return ""
        content = TRACKER_FILE.read_text(encoding="utf-8")
        for line in content.split("\n")[:30]:
            stripped = line.strip()
            if ("/" in stripped and "✅" in stripped) or "Прогрес" in stripped:
                return f"SPRINT PROGRESS: {stripped}\n"
        return ""
    except Exception:
        return ""


MAPS_DIR = (Path(__file__).resolve().parents[2] / "XDEV/MAPS")

MAP_KEYWORD_ROUTES: dict[str, str] = {
    "billing": "BILLING_FLOW_MAP.md",
    "payment": "BILLING_FLOW_MAP.md",
    "subscription": "BILLING_FLOW_MAP.md",
    "mono": "BILLING_FLOW_MAP.md",
    "chat": "CLIENT_ZONE_MAP.md",
    "message": "CLIENT_ZONE_MAP.md",
    "my/": "CLIENT_ZONE_MAP.md",
    "client zone": "CLIENT_ZONE_MAP.md",
    "profile": "CLIENT_ZONE_MAP.md",
    "notification": "NOTIFICATION_MAP.md",
    "push": "NOTIFICATION_MAP.md",
    "telegram": "NOTIFICATION_MAP.md",
    "orchestrator": "NOTIFICATION_MAP.md",
    "cron": "CRON_SCHEDULER_MAP.md",
    "background": "CRON_SCHEDULER_MAP.md",
    "flash deal": "CRON_SCHEDULER_MAP.md",
    "flash": "CRON_SCHEDULER_MAP.md",
    "rls": "DATABASE_SECURITY_RLS_MAP.md",
    "security": "DATABASE_SECURITY_RLS_MAP.md",
    "migration": "DATABASE_SECURITY_RLS_MAP.md",
    "supabase": "DATABASE_SECURITY_RLS_MAP.md",
    "booking": "MODALS_MAP.md",
    "modal": "MODALS_MAP.md",
    "drawer": "MODALS_MAP.md",
    "sheet": "MODALS_MAP.md",
    "onboarding": "ONBOARDING_FLOW_MAP.md",
    "wizard": "ONBOARDING_FLOW_MAP.md",
    "referral": "REFERRAL_MAP.md",
    "c2c": "REFERRAL_MAP.md",
    "b2b": "REFERRAL_MAP.md",
    "shop": "SHOP_ORDER_FLOW_MAP.md",
    "order": "SHOP_ORDER_FLOW_MAP.md",
    "design": "DESIGN_SYSTEM_TOKENS_MAP.md",
    "token": "DESIGN_SYSTEM_TOKENS_MAP.md",
    "theme": "DESIGN_SYSTEM_TOKENS_MAP.md",
    "frost": "DESIGN_SYSTEM_TOKENS_MAP.md",
    "test": "TESTING_MAP.md",
    "e2e": "TESTING_MAP.md",
    "playwright": "TESTING_MAP.md",
    "deep link": "DEEP_LINK_MAP.md",
    "url": "DEEP_LINK_MAP.md",
    "slug": "DEEP_LINK_MAP.md",
    "explore": "CLIENT_ZONE_MAP.md",
    "landing": "CLIENT_ZONE_MAP.md",
    "release": "PAGE_RELEASE_ROADMAP.md",
    "launch": "PAGE_RELEASE_ROADMAP.md",
}


def get_relevant_maps(task_text: str, handoff_content: str = "") -> str:
    """Match current task + HANDOFF keywords to relevant MAP files."""
    try:
        if not MAPS_DIR.exists():
            return ""
        # Use passed content to avoid re-reading HANDOFF.md (already read in get_current_task)
        raw = ""
        content_to_search = handoff_content
        if not content_to_search and HANDOFF_FILE.exists():
            try:
                content_to_search = HANDOFF_FILE.read_text(encoding="utf-8", errors="replace")
            except Exception:
                pass
        for line in content_to_search.split("\n")[:15]:
            if "наступна задача" in line.lower() or "next task" in line.lower():
                raw = line
                break
        if not raw and task_text:
            # Fallback: first line of task_text that looks like a task name
            for line in task_text.split("\n"):
                if "T-" in line or "task" in line.lower() or "задач" in line.lower():
                    raw = line[:200]
                    break
        t = raw.lower()
        seen: set[str] = set()
        matched: list[str] = []
        for kw, fname in MAP_KEYWORD_ROUTES.items():
            if kw in t and fname not in seen:
                seen.add(fname)
                matched.append(fname)
            if len(matched) >= 3:
                break
        if not matched:
            return ""
        names = " | ".join(matched)
        return f"RELEVANT MAPS for this task: {names}\n"
    except Exception:
        return ""


STARTUP_PROTOCOL = """\
=== MANDATORY SESSION STARTUP — execute before anything else ===

STEP 1: Call mcp__mempalace__mempalace_status (tool call, not just mention)
STEP 2: Read XDEV/MAPS/SYSTEM_MAP.md (last 50 lines, offset mode)
STEP 3: If RELEVANT MAPS shown above — read the first 30 lines of each
STEP 4: Write in your first response: "STARTUP OK: Palace [N drawers] | SYSTEM_MAP current | Ready"

CRITICAL: No file reads for tasks, no code, no answers until STARTUP OK is confirmed.
This is IRON RULE -1. It cannot be skipped, deferred, or abbreviated.
"""


def main() -> int:
    reset_session_state()

    graphify_ctx            = get_graphify_summary()
    current_task, handoff_content = get_current_task()
    tracker_prog            = get_tracker_progress()
    relevant_maps           = get_relevant_maps(current_task, handoff_content)

    parts = []
    if graphify_ctx:
        parts.append(graphify_ctx)
    if tracker_prog:
        parts.append(tracker_prog)
    if relevant_maps:
        parts.append(relevant_maps)
    if current_task:
        parts.append(current_task)
    parts.append(STARTUP_PROTOCOL)

    full_context = "\n".join(parts)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": full_context
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
