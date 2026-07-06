#!/usr/bin/env python3
"""
GRAPHIFY_POST_HOOK — PostToolUse (Glob|Grep|Read|Edit|Write):
Parses actual tool output to extract real file paths and updates graph-index.json.
This gives accurate per-file hotness scores instead of tracking search directories.
"""

import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).parent))
try:
    from graphify_hook import track_file
except ImportError:
    def track_file(f, t):
        pass

# Extensions considered "code files" worth tracking
CODE_EXTS = {
    ".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md",
    ".py", ".sql", ".env", ".yaml", ".yml", ".toml",
}

# Regex: matches absolute or relative paths ending in a known extension
_PATH_RE = re.compile(
    r'([A-Za-z]:[/\\][^\n\r"\'<>|?*]+'
    r'|(?:bookit|src|\.claude|XDEV|supabase)[/\\][^\n\r"\'<>|?*]+)'
)


def extract_paths_from_text(text: str) -> list[str]:
    """Extract file paths from Grep/Glob text output."""
    paths = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("Found ") or line.startswith("No files"):
            continue
        # Try regex match first
        m = _PATH_RE.search(line)
        if m:
            candidate = m.group(0).rstrip(".,;")
            if Path(candidate).suffix in CODE_EXTS:
                paths.append(candidate)
            continue
        # Fallback: bare relative path with known extension
        if any(line.endswith(ext) for ext in CODE_EXTS) and ("/" in line or "\\" in line):
            paths.append(line)
    return paths


def extract_from_response(tool_response, tool: str) -> list[str]:
    """Extract file paths from tool_response in any format."""
    paths = []

    if isinstance(tool_response, dict):
        # Grep files_with_matches: {"mode": "files_with_matches", "filenames": [...], "numFiles": N}
        if "filenames" in tool_response:
            return [f for f in tool_response["filenames"] if Path(f).suffix in CODE_EXTS]

        # Grep content mode: {"mode": "content", "matches": [{"filename": ..., ...}, ...]}
        if "matches" in tool_response:
            seen = set()
            for m in tool_response["matches"]:
                fn = m.get("filename", "") if isinstance(m, dict) else ""
                if fn and fn not in seen and Path(fn).suffix in CODE_EXTS:
                    paths.append(fn)
                    seen.add(fn)
            return paths

        # Glob: {"filenames": [...]} or {"files": [...]}
        for key in ("filenames", "files", "paths"):
            if key in tool_response:
                return [f for f in tool_response[key] if Path(f).suffix in CODE_EXTS]

        # Fallback: stringify and parse
        return extract_paths_from_text(json.dumps(tool_response))

    if isinstance(tool_response, list):
        return [f for f in tool_response if isinstance(f, str) and Path(f).suffix in CODE_EXTS]

    if isinstance(tool_response, str):
        return extract_paths_from_text(tool_response)

    return paths


def main():
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))

        tool      = data.get("tool_name", "").lower()
        inp       = data.get("tool_input", {})
        response  = data.get("tool_response", "")

        if tool in ("glob", "grep"):
            paths = extract_from_response(response, tool)
            ctype = tool
            for p in paths:
                track_file(p, ctype)

        elif tool == "read":
            fp = inp.get("file_path", "")
            if fp and Path(fp).suffix in CODE_EXTS:
                track_file(fp, "read")

        elif tool in ("edit", "write"):
            fp = inp.get("file_path", "")
            if fp:
                track_file(fp, tool)

    except Exception as e:
        # Debug: log raw input for diagnosis
        try:
            debug_path = Path("C:/Users/Vitos/SaaS/graphify-out/debug_last.json")
            debug_path.parent.mkdir(parents=True, exist_ok=True)
            debug_path.write_text(
                json.dumps({"error": str(e), "raw": raw.decode("utf-8", errors="replace")[:2000]}, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
