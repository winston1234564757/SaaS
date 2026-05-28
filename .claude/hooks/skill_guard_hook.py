#!/usr/bin/env python3
"""
SKILL_GUARD_HOOK — Stop event: detects if Claude declared a skill in text
but the Skill tool was NOT called in the same turn.

Reads stdin JSON (Stop event payload) — checks tool_uses list for Skill calls
vs text output containing 'SKILL:' pattern. Outputs systemMessage if mismatch.
"""
import sys
import json
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        data = {}

    # Extract text content from the response
    text_output = ""
    tool_uses = []

    # Stop hook payload varies — try common keys
    for key in ("response", "assistant_message", "message", "content"):
        val = data.get(key)
        if isinstance(val, str):
            text_output = val
            break
        if isinstance(val, list):
            for block in val:
                if isinstance(block, dict):
                    if block.get("type") == "text":
                        text_output += block.get("text", "")
                    if block.get("type") == "tool_use":
                        tool_uses.append(block.get("name", ""))

    # Also check top-level tool_uses
    raw_tools = data.get("tool_uses", [])
    if isinstance(raw_tools, list):
        for t in raw_tools:
            if isinstance(t, dict):
                tool_uses.append(t.get("name", ""))

    # Check for SKILL: declaration in text
    skill_declared = bool(re.search(r'\bSKILL\s*:\s*\S', text_output, re.IGNORECASE))

    # Check if Skill tool was actually called
    skill_tool_called = any("skill" in t.lower() for t in tool_uses)

    if skill_declared and not skill_tool_called and tool_uses is not None:
        # Mismatch detected — output warning
        msg = (
            "⚠️ SKILL PROTOCOL VIOLATION: You wrote 'SKILL: ...' in your response "
            "but did NOT call the Skill tool. This is a zero-tolerance rule. "
            "In your next response, call Skill(skill='[name]') immediately."
        )
        print(json.dumps({"systemMessage": msg}, ensure_ascii=False))
    else:
        # No violation or can't determine — silent pass
        print(json.dumps({}, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    sys.exit(main())
