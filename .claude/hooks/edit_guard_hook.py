#!/usr/bin/env python3
"""
EDIT_GUARD_HOOK v1.0 — PreToolUse (Edit|Write).
Merged from: edit_rules_hook.py (encoding) + humanizer_guard_hook.py (UI text).

Checks (in order):
  1. Encoding — cp1251 mojibake + curly quotes → block (exit 2)
  2. Humanizer — Ukrainian UI text without '// humanized' marker → block (exit 2)
"""
import sys
import json
import re
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ── Encoding check ────────────────────────────────────────────────────────────
MOJIBAKE       = [b"\xd0\xa0\xc2"]
CURLY_DOUBLE   = [b"\xe2\x80\x9c", b"\xe2\x80\x9d"]
CURLY_SINGLE   = [b"\xe2\x80\x98", b"\xe2\x80\x99"]
ENCODING_EXTS  = {".ts", ".tsx", ".md", ".py", ".json", ".sql", ".txt"}

# ── Humanizer check ───────────────────────────────────────────────────────────
UA_RE = re.compile(r"[Ѐ-ӿ]")
HUMANIZER_EXTS = {".tsx", ".ts", ".jsx", ".js"}
MAX_REPORT = 5

UI_PATTERNS = [
    re.compile(r">\s*([Ѐ-ӿ][^<\n]{2,}?)\s*(?:<|$)", re.MULTILINE),
    re.compile(r"(?:title|message|description|label|placeholder|text)\s*[:=]\s*['\"`]([Ѐ-ӿ][^'\"`\n]{2,}?)['\"`]"),
    re.compile(r"(?:children|buttonText|btnText|caption)\s*[:=]\s*['\"`]([Ѐ-ӿ][^'\"`\n]{2,}?)['\"`]"),
    re.compile(r"(?:error|success|warning|info)\s*[:=]\s*['\"`]([Ѐ-ӿ][^'\"`\n]{2,}?)['\"`]"),
]
IGNORE_PATTERNS = [
    re.compile(r"aria-label"),
    re.compile(r"data-testid"),
    re.compile(r"//.*[Ѐ-ӿ]"),
    re.compile(r"//\s*humanized"),
    re.compile(r"import\s|from\s|require\("),
    re.compile(r"console\.(log|warn|error)"),
    re.compile(r"[Ѐ-ӿ]{1,3}$"),
]


def check_encoding(path: Path) -> str | None:
    """Returns error message if encoding issues found, else None."""
    if path.suffix not in ENCODING_EXTS or not path.exists():
        return None
    try:
        with open(path, "rb") as f:
            raw = f.read()
        if b"\xd0" not in raw and b"\xd1" not in raw:
            return None
        issues = []
        if any(pat in raw for pat in MOJIBAKE):
            issues.append("cp1251 mojibake")
        if any(pat in raw for pat in CURLY_DOUBLE):
            issues.append("curly double quotes")
        if any(pat in raw for pat in CURLY_SINGLE):
            issues.append("curly single quotes")
        if issues:
            return f"[ENCODING GUARD] EDIT BLOCKED: {path.name}\n  Issues: {', '.join(issues)}\n  Fix first: XDEV/ENCODING_FIX_PROMPT.md"
    except Exception:
        pass
    return None


def extract_ui_strings(content: str) -> list:
    found = set()
    for pattern in UI_PATTERNS:
        for match in pattern.finditer(content):
            text = match.group(1).strip()
            if len(text) < 4:
                continue
            line_start = content.rfind("\n", 0, match.start()) + 1
            line_end   = content.find("\n", match.end())
            line = content[line_start:line_end if line_end != -1 else len(content)]
            if any(ip.search(line) for ip in IGNORE_PATTERNS):
                continue
            found.add(text[:80])
    return list(found)[:MAX_REPORT]


def check_humanizer(path: Path, new_content: str) -> str | None:
    """Returns error message if Ukrainian UI text detected without humanizer marker."""
    if path.suffix not in HUMANIZER_EXTS:
        return None
    if not new_content or not UA_RE.search(new_content):
        return None
    if "// humanized" in new_content:
        return None
    ui_strings = extract_ui_strings(new_content)
    if not ui_strings:
        return None
    lines = [f"[HUMANIZER GUARD] BLOCKED: Ukrainian UI text in {path.name}"]
    lines.append("These strings must go through /humanizer BEFORE editing:")
    for s in ui_strings:
        lines.append(f'  • "{s}"')
    lines.append("")
    lines.append("TO UNBLOCK — one of:")
    lines.append("  1. Run /humanizer on the strings, then add '// humanized' comment near them")
    lines.append("  2. Already humanized? Add '// humanized' anywhere in the new_string block")
    lines.append("")
    lines.append("EXEMPT: aria-label, data-testid, date formats, console logs.")
    return "\n".join(lines)


def main() -> int:
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})
        file_path  = tool_input.get("file_path", "")
        if not file_path:
            return 0

        path        = Path(file_path)
        new_content = tool_input.get("new_string") or tool_input.get("content") or ""

        # 1. Encoding check (file on disk)
        enc_err = check_encoding(path)
        if enc_err:
            print(enc_err)
            return 2

        # 2. Humanizer check (content being written)
        hum_err = check_humanizer(path, new_content)
        if hum_err:
            print(hum_err)
            return 2

        return 0

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
