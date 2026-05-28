import json
import sys
import re
import os


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    fpath = data.get("tool_input", {}).get("file_path", "")
    if not fpath:
        sys.exit(0)

    if not fpath.endswith((".tsx", ".ts", ".css")):
        sys.exit(0)

    try:
        with open(fpath, encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception:
        sys.exit(0)

    hex_colors = list(dict.fromkeys(re.findall(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", content)))
    tailwind_colors = list(dict.fromkeys(re.findall(r"(?:text|bg|border|ring|fill|stroke)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}", content)))

    has_color_content = hex_colors or tailwind_colors or fpath.endswith(".css")
    if not has_color_content:
        sys.exit(0)

    basename = os.path.basename(fpath)
    parts = []
    if hex_colors:
        parts.append("hex colors: " + ", ".join(hex_colors[:6]))
    if tailwind_colors:
        parts.append("Tailwind classes: " + ", ".join(tailwind_colors[:6]))

    color_info = "; ".join(parts) if parts else "CSS color definitions"

    context = (
        f"[a11y-hook] {basename} contains {color_info}. "
        "If you introduced or changed foreground/background color pairs, "
        "call mcp__a11y__get-color-contrast (pass hex foreground + background) "
        "or mcp__a11y__are-colors-accessible to verify WCAG AA compliance "
        "(4.5:1 for normal text, 3:1 for large/bold text). "
        "Skip if colors are decorative only (borders, shadows, icons without text)."
    )

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": context
        }
    }))


main()
