#!/usr/bin/env python3
"""
SKILL_ROUTER_HOOK v1.0 — UserPromptSubmit + PreToolUse (Edit|Write)
Reads skills-taxonomy.json → context scoring → outputs:
  SKILL ROUTE: Category → skill:subtool1+subtool2 (alt: X, Y)
  QA-GATE SKILLS: grill-me + brainstorming  (task-type specific)
Token-efficient: 1-2 lines max output.
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TAXONOMY_FILE = Path(__file__).parent / "skills-taxonomy.json"

# QA-GATE task-type routing
BUG_KW     = ['fix', 'bug', 'broken', 'error', 'crash', 'fail', 'виправ', 'фікс', 'баг', 'не працює', 'зламан']
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
]


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


def get_qa_gate(task_type: str | None) -> str | None:
    if task_type in ("BUG", "REFACTOR"):
        return "grill-me + adversarial-reviewer"
    if task_type == "DESIGN_FEATURE":
        return "brainstorming + grill-me"
    if task_type == "DB":
        return "grill-me + security-review"
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
        return None, None, None

    # Score all categories
    cat_scores = {}
    for cat_name, cat_data in taxonomy.get("categories", {}).items():
        s = score_category(cat_data, prompt_text, file_path)
        if s > 0:
            cat_scores[cat_name] = s

    if not cat_scores:
        return None, None, None

    best_cat = max(cat_scores, key=cat_scores.get)
    cat_data = taxonomy["categories"][best_cat]
    skills = cat_data.get("skills", [])

    if not skills:
        return best_cat, None, []

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

    return best_cat, skill_str, alts


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        print(json.dumps({}))
        return 0

    tool_name   = data.get("tool_name", "")
    prompt_text = ""
    file_path   = ""

    if tool_name in ("Edit", "Write"):
        # PreToolUse: route by file path only
        file_path = get_file_path(data)
        if not file_path:
            print(json.dumps({}))
            return 0
    else:
        # UserPromptSubmit
        prompt_text = get_prompt_text(data)
        if not prompt_text or is_session_start(prompt_text):
            print(json.dumps({}))
            return 0
        if not is_task_prompt(prompt_text):
            print(json.dumps({}))
            return 0

    taxonomy = load_taxonomy()
    category, skill_str, alts = route(taxonomy, prompt_text, file_path)

    lines = []
    if skill_str:
        alt_str = f" (alt: {', '.join(alts)})" if alts else ""
        lines.append(f"SKILL ROUTE: {category} → {skill_str}{alt_str}")

    if prompt_text:
        task_type = detect_task_type(prompt_text)
        qa = get_qa_gate(task_type)
        if qa:
            lines.append(f"QA-GATE SKILLS: {qa}")

    if not lines:
        print(json.dumps({}))
        return 0

    hook_event = "PreToolUse" if tool_name in ("Edit", "Write") else "UserPromptSubmit"
    output = {
        "hookSpecificOutput": {
            "hookEventName": hook_event,
            "additionalContext": "\n".join(lines)
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
