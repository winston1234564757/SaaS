#!/usr/bin/env python3
"""
HUMANIZER_GUARD_HOOK — PreToolUse (Edit|Write):
Detects Ukrainian UI text in new_string/content and warns if humanizer wasn't run.
Non-blocking (exit 0) — outputs warning that Claude must acknowledge.
"""
import sys
import json
import re
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ukrainian Unicode range
UA_RE = re.compile(r'[Ѐ-ӿ]')

# Patterns that indicate user-visible UI text (not technical strings)
UI_PATTERNS = [
    # JSX text nodes: >Текст< or >Текст at end
    re.compile(r'>\s*([Ѐ-ӿ][^<\n]{2,}?)\s*(?:<|$)', re.MULTILINE),
    # Toast / notification props
    re.compile(r'(?:title|message|description|label|placeholder|text)\s*[:=]\s*[\'"`]([Ѐ-ӿ][^\'"`\n]{2,}?)[\'"`]'),
    # Button children text (common patterns)
    re.compile(r'(?:children|buttonText|btnText|caption)\s*[:=]\s*[\'"`]([Ѐ-ӿ][^\'"`\n]{2,}?)[\'"`]'),
    # Error/success messages
    re.compile(r'(?:error|success|warning|info)\s*[:=]\s*[\'"`]([Ѐ-ӿ][^\'"`\n]{2,}?)[\'"`]'),
]

# Patterns to IGNORE (technical strings, not UI text)
IGNORE_PATTERNS = [
    re.compile(r'aria-label'),
    re.compile(r'data-testid'),
    re.compile(r'//.*[Ѐ-ӿ]'),          # comments
    re.compile(r'//\s*humanized'),                # explicitly marked
    re.compile(r'import\s|from\s|require\('),     # imports
    re.compile(r'console\.(log|warn|error)'),     # console
    re.compile(r'[Ѐ-ӿ]{1,3}$'),        # too short (abbreviations)
]

# Extensions we care about
CHECKABLE_EXT = {'.tsx', '.ts', '.jsx', '.js'}

# Max strings to report (avoid noise)
MAX_REPORT = 5


def extract_ui_strings(content: str) -> list:
    found = set()
    for pattern in UI_PATTERNS:
        for match in pattern.finditer(content):
            text = match.group(1).strip()
            if len(text) < 4:
                continue
            # Skip if line contains ignore patterns
            line_start = content.rfind('\n', 0, match.start()) + 1
            line_end = content.find('\n', match.end())
            line = content[line_start:line_end if line_end != -1 else len(content)]
            if any(ip.search(line) for ip in IGNORE_PATTERNS):
                continue
            found.add(text[:80])
    return list(found)[:MAX_REPORT]


def main():
    try:
        raw_in = sys.stdin.buffer.read()
        data = json.loads(raw_in.decode("utf-8", errors="replace"))
        tool_input = data.get("tool_input", {})

        file_path = tool_input.get("file_path", "")
        path = Path(file_path)
        if path.suffix not in CHECKABLE_EXT:
            return 0

        # Get the text being written
        new_content = tool_input.get("new_string") or tool_input.get("content") or ""
        if not new_content:
            return 0

        # Quick check: any Ukrainian at all?
        if not UA_RE.search(new_content):
            return 0

        ui_strings = extract_ui_strings(new_content)
        if not ui_strings:
            return 0

        print(f"[HUMANIZER GUARD] Ukrainian UI text detected in {path.name}:")
        for s in ui_strings:
            print(f"  • \"{s}\"")
        print()
        print("REQUIRED: Confirm these strings went through /humanizer.")
        print("If already humanized → add '// humanized' comment near the strings OR")
        print("respond 'HUMANIZER: confirmed for [list]' before this edit proceeds.")
        print()
        print("Skip only for: aria-label, data-testid, date formats, status codes.")
        return 0  # Warning only, not blocking

    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
