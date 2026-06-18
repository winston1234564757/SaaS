#!/usr/bin/env python3
"""
SKILL_ROUTER_HOOK v2.0 — UserPromptSubmit + PreToolUse (Edit|Write)
Reads skills-taxonomy.json -> context scoring -> outputs MANDATORY directives:
  [MANDATORY] Invoke Skill(skill='X') for this task.
  SEQUENCE: grill-me -> X -> code-reviewer -> ship-gate
Token-efficient: 3 lines max output.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TAXONOMY_FILE = Path(__file__).parent / "skills-taxonomy.json"

# QA-GATE task-type routing
BUG_KW     = ['fix', 'bug', 'broken', 'error', 'crash', 'fail', 'vyprав', 'фікс', 'баг', 'не працює', 'зламан', 'виправ']
DESIGN_KW  = ['redesign', 'design', 'ui ', 'layout', 'component', 'дизайн', 'компонент', 'переробити', 'зовніш']
FEATURE_KW = ['feature', 'add ', 'implement', 'create', 'build ', 'фіча', 'додай', 'реалізу', 'зроби', 'створ', 'налашту']
DB_KW      = ['migration', 'schema', 'rls', ' table', ' sql', 'database', 'міграці', 'суп', 'migrate', 'alter table']
REFACTOR_KW= ['refactor', 'рефактор', 'cleanup', 'simplify', 'improve codebase', 'clean up']

# Skip routing for session-start prompts
SESSION_KW = ['привіт', 'hello', 'hi ', 'нова сесія', 'починаємо', 'startup ok', 'wake', 'старт']

# Task keywords (must have at least one to trigger routing)
TASK_KW    = BUG_KW + DESIGN_KW + FEATURE_KW + DB_KW + REFACTOR_KW + [
    'зроби', 'налашту', 'конфігур', 'перепиши', 'додай', 'покращ', 'оптиміз',
    'task', 'задач', 'sprint', 'implement', 'build', 'create', 'redesign',
    'fix', 'make', 'update', 'change', 'add', 'remove', 'delete', 'move',
    'setup', 'configure', 'deploy', 'refactor', 'optimize', 'review', 'audit',
    # Copy-UX triggers
    'humanize', 'copy', 'текст', 'label', 'кнопка', 'toast', 'message text',
    # Workflow triggers
    'plan', 'triage', 'diagnose', 'handoff', 'sprint end',
]

# MANDATORY sequences per category
CATEGORY_SEQUENCES = {
    "UI-Design":        "grill-me --> {skill} --> impeccable:critique --> code-reviewer",
    "Frontend-Code":    "grill-me --> {skill} --> code-reviewer --> ship-gate",
    "Backend-API":      "grill-me --> {skill} --> security-review --> code-reviewer",
    "Security":         "grill-me --> security-review --> {skill} --> code-reviewer",
    "Database":         "grill-me --> {skill} --> security-review",
    "Testing":          "grill-me --> {skill} --> verify",
    "DevOps-Deploy":    "grill-me --> {skill} --> ship-gate",
    "Performance":      "grill-me --> {skill} --> pagespeed-enhancer",
    "Architecture":     "grill-me --> {skill} --> code-reviewer",
    "Copy-UX":          "humanizer --> {skill}",
    "Workflow-Session": "{skill}",
    "Billing-SaaS":     "grill-me --> {skill} --> security-review --> code-reviewer",
    "Code-Quality":     "grill-me --> code-reviewer --> {skill}",
}


def load_taxonomy():
    try:
        if TAXONOMY_FILE.exists():
            return json.loads(TAXONOMY_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return None


def get_prompt_text(data):
    for key in ("message", "user_message", "prompt", "content"):
        if key in data and isinstance(data[key], str):
            return data[key]
    if "messages" in data:
        msgs = data.get("messages", [])
        if msgs and isinstance(msgs[-1], dict):
            return msgs[-1].get("content", "")
    return ""


def get_file_path(data):
    return data.get("tool_input", {}).get("file_path", "")


def is_session_start(text: str) -> bool:
    t = text.lower().strip()
    return len(t) < 15 or any(kw in t for kw in SESSION_KW)


def is_task_prompt(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in TASK_KW)


def detect_task_type(text: str) -> str | None:
    t = text.lower()
    if any(kw in t for kw in DB_KW):
        return "DB"
    if any(kw in t for kw in BUG_KW):
        return "BUG"
    if any(kw in t for kw in REFACTOR_KW):
        return "REFACTOR"
    if any(kw in t for kw in DESIGN_KW) or any(kw in t for kw in FEATURE_KW):
        return "DESIGN_FEATURE"
    return None


def score_category(cat_data: dict, text: str, file_path: str) -> int:
    score = 0
    t = text.lower()
    p = file_path.lower()
    for kw in cat_data.get("keywords", []):
        if kw.lower() in t:
            score += 5
    for pattern in cat_data.get("file_patterns", []):
        if pattern.lower() in p:
            score += 10
    return score


def score_skill(skill: dict, text: str) -> int:
    t = text.lower()
    s = 0
    for kw, w in skill.get("weight_keywords", {}).items():
        if kw.lower() in t:
            s += w
    return s


def detect_subtools(skill_data: dict, text: str) -> list[str]:
    t = text.lower()
    found = []
    for subtool, kws in skill_data.get("subtool_keywords", {}).items():
        if any(kw.lower() in t for kw in kws):
            found.append(subtool)
    if not found:
        return skill_data.get("default_subtools", [])
    return found[:3]


def route(taxonomy, prompt_text: str, file_path: str):
    if not taxonomy:
        return None, None, [], None

    # Score all categories
    cat_scores = {}
    for cat_name, cat_data in taxonomy.get("categories", {}).items():
        s = score_category(cat_data, prompt_text, file_path)
        if s > 0:
            cat_scores[cat_name] = s

    if not cat_scores:
        # Fallback: detect task type and use default category
        text_lower = prompt_text.lower() + file_path.lower()
        if any(kw in text_lower for kw in DB_KW):
            cat_scores["Database"] = 1
        elif any(kw in text_lower for kw in BUG_KW):
            cat_scores["Frontend-Code"] = 1
        elif any(kw in text_lower for kw in REFACTOR_KW):
            cat_scores["Code-Quality"] = 1
        else:
            return None, None, [], None

    best_cat = max(cat_scores, key=cat_scores.get)
    cat_data = taxonomy["categories"][best_cat]
    skills = cat_data.get("skills", [])

    if not skills:
        return best_cat, None, [], None

    # Score skills within category
    scored = [(s["name"], score_skill(s, prompt_text), s) for s in skills]
    scored.sort(key=lambda x: x[1], reverse=True)

    top_name, _, top_data = scored[0]
    alts = [s[0] for s in scored[1:3]]

    # Detect subtools
    subtools = detect_subtools(top_data, prompt_text)
    skill_str = top_name
    if subtools:
        skill_str += ":" + "+".join(subtools)

    raw_seq = CATEGORY_SEQUENCES.get(best_cat, "grill-me --> {skill} --> code-reviewer")
    raw_seq = raw_seq.replace("{skill}", skill_str)
    # Deduplicate consecutive identical steps
    steps = [s.strip() for s in raw_seq.split("-->")]
    deduped = [steps[0]] + [s for i, s in enumerate(steps[1:], 1) if s != steps[i - 1]]
    sequence = " --> ".join(deduped)

    return best_cat, skill_str, alts, sequence


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        print(json.dumps({}))
        return 0

    # UserPromptSubmit only — Edit|Write branch removed (was dead code, not wired in settings.json)
    prompt_text = get_prompt_text(data)
    file_path   = ""

    if not prompt_text or is_session_start(prompt_text):
        print(json.dumps({}))
        return 0
    if not is_task_prompt(prompt_text):
        print(json.dumps({}))
        return 0

    taxonomy = load_taxonomy()
    category, skill_str, alts, sequence = route(taxonomy, prompt_text, file_path)

    lines = []
    if skill_str:
        primary = skill_str.split(":")[0]
        alt_str = f" | alt: {', '.join(alts)}" if alts else ""
        lines.append(f"[MANDATORY] Task: {category}. Invoke Skill(skill='{primary}') BEFORE writing code.{alt_str}")
        lines.append(f"SEQUENCE: {sequence}")

    if not lines:
        print(json.dumps({}))
        return 0

    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": "\n".join(lines)
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
