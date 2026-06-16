#!/usr/bin/env python3
"""
CONTEXT7_HINT_HOOK v1.0 — UserPromptSubmit
Detects library / service keywords in user prompt →
injects MCP / CLI hints so Claude uses live docs instead of memory.
Non-blocking (exit 0).
"""
import sys
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SESSION_KW = ['привіт', 'hello', 'hi ', 'нова сесія', 'startup ok', 'починаємо', 'wake']

# Library → context7 resolve hint
LIBRARY_HINTS: dict[str, str] = {
    "next.js":        "mcp__context7__resolve-library-id('next.js')",
    "nextjs":         "mcp__context7__resolve-library-id('next.js')",
    "next js":        "mcp__context7__resolve-library-id('next.js')",
    "tailwind":       "mcp__context7__resolve-library-id('tailwindcss')",
    "framer-motion":  "mcp__context7__resolve-library-id('framer-motion')",
    "framer motion":  "mcp__context7__resolve-library-id('framer-motion')",
    "framer":         "mcp__context7__resolve-library-id('framer-motion')",
    "tanstack":       "mcp__context7__resolve-library-id('tanstack/react-query')",
    "react query":    "mcp__context7__resolve-library-id('tanstack/react-query')",
    "zustand":        "mcp__context7__resolve-library-id('zustand')",
    "vaul":           "mcp__context7__resolve-library-id('vaul')",
    "radix":          "mcp__context7__resolve-library-id('radix-ui')",
    "shadcn":         "mcp__context7__resolve-library-id('shadcn-ui')",
    "stripe":         "mcp__context7__resolve-library-id('stripe')",
    "playwright":     "mcp__context7__resolve-library-id('playwright')",
    "vitest":         "mcp__context7__resolve-library-id('vitest')",
    "prisma":         "mcp__context7__resolve-library-id('prisma')",
    "zod":            "mcp__context7__resolve-library-id('zod')",
    "lucide":         "mcp__context7__resolve-library-id('lucide-react')",
}

# Service → direct tool / CLI hints
SERVICE_HINTS: dict[str, str] = {
    "supabase":   "[SUPABASE MCP] → mcp__supabase__execute_sql | list_tables | get_logs | apply_migration",
    "vercel":     "[VERCEL CLI]   → Bash(vercel --prod) is allowed",
    "деплой":     "[VERCEL CLI]   → Bash(vercel --prod) is allowed",
    "deploy":     "[VERCEL CLI]   → Bash(vercel --prod) is allowed",
    "github":     "[GITHUB CLI]   → gh pr create | gh issue | gh workflow run",
    "pull request": "[GITHUB CLI] → gh pr create / gh pr list / gh pr merge",
    "tailwind":   "[TAILWIND MCP] → mcp__tailwind__generate_component_template | get_tailwind_colors",
    "accessibility": "[A11Y MCP]  → mcp__a11y__get-color-contrast | are-colors-accessible",
    "a11y":       "[A11Y MCP]    → mcp__a11y__get-color-contrast | are-colors-accessible",
    "icon":       "[ICONS MCP]   → mcp__universal-icons__search_icons | get_icon",
    "icons":      "[ICONS MCP]   → mcp__universal-icons__search_icons | get_icon",
}


def get_prompt_text(data: dict) -> str:
    for key in ("message", "user_message", "prompt", "content"):
        if key in data and isinstance(data[key], str):
            return data[key]
    if "messages" in data:
        msgs = data.get("messages", [])
        if msgs and isinstance(msgs[-1], dict):
            return msgs[-1].get("content", "")
    return ""


def main() -> int:
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        print(json.dumps({}))
        return 0

    prompt = get_prompt_text(data)
    if not prompt or len(prompt.strip()) < 10:
        print(json.dumps({}))
        return 0

    t = prompt.lower()
    if any(kw in t for kw in SESSION_KW):
        print(json.dumps({}))
        return 0

    hints: list[str] = []
    seen: set[str] = set()

    # Library hints (context7)
    for lib, resolve_call in LIBRARY_HINTS.items():
        if lib in t and lib not in seen:
            hints.append(f"[CONTEXT7] {lib} detected → call {resolve_call} FIRST, then query-docs")
            seen.add(lib)
            # Deduplicate next.js / nextjs
            if lib in ("next.js", "nextjs", "next js"):
                seen.update({"next.js", "nextjs", "next js"})
            if lib in ("framer", "framer-motion", "framer motion"):
                seen.update({"framer", "framer-motion", "framer motion"})

    # Service hints
    for svc, hint in SERVICE_HINTS.items():
        if svc in t and svc not in seen:
            hints.append(hint)
            seen.add(svc)

    if not hints:
        print(json.dumps({}))
        return 0

    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": "\n".join(hints)
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
