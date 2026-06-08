#!/usr/bin/env python3
"""
GRAPHIFY_HOOK — PreToolUse (Glob|Grep|Read|Edit|Write):
Tracks file access in graph-index.json + injects hot-file hints
when navigating near frequently-edited areas of the codebase.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path("C:/Users/Vitossik/SaaS")
GRAPHIFY_OUT  = PROJECT_ROOT / "graphify-out"
GRAPH_INDEX   = GRAPHIFY_OUT / "graph-index.json"

HOT_WRITES   = 4   # files with 4+ writes are "hot"
HOT_SEARCHES = 8   # files with 8+ searches are "central"
MAX_CHANGES  = 500 # keep log bounded


def load_index():
    if GRAPH_INDEX.exists():
        try:
            return json.loads(GRAPH_INDEX.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "version": "2.0",
        "last_updated": None,
        "total_searches": 0,
        "total_edits": 0,
        "files": {},
        "changes": [],
    }


def save_index(index):
    GRAPHIFY_OUT.mkdir(parents=True, exist_ok=True)
    GRAPH_INDEX.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


def track(index, filepath: str, change_type: str):
    index["changes"].append({
        "ts": datetime.now().isoformat(),
        "file": filepath,
        "type": change_type,
    })
    if len(index["changes"]) > MAX_CHANGES:
        index["changes"] = index["changes"][-MAX_CHANGES:]

    index["last_updated"] = datetime.now().isoformat()

    key = str(filepath)
    if key not in index["files"]:
        index["files"][key] = {"reads": 0, "writes": 0, "searches": 0, "last_seen": None}

    slot = index["files"][key]
    if change_type in ("glob", "grep"):
        slot["searches"] += 1
        index["total_searches"] = index.get("total_searches", 0) + 1
    elif change_type in ("edit", "write"):
        slot["writes"] += 1
        index["total_edits"] = index.get("total_edits", 0) + 1
    elif change_type == "read":
        slot["reads"] += 1

    slot["last_seen"] = datetime.now().isoformat()
    return index


def related_hot(index, query: str, limit=4):
    """Files whose path overlaps with query keywords AND are hot."""
    q = query.lower()
    keywords = [k for k in q.replace("/", " ").replace(".", " ").replace("*", " ").split() if len(k) > 3]
    if not keywords:
        return []

    results = []
    for path, d in index.get("files", {}).items():
        pl = path.lower()
        if any(k in pl for k in keywords):
            score = d["writes"] * 3 + d["searches"]
            if d["writes"] >= HOT_WRITES or d["searches"] >= HOT_SEARCHES:
                results.append((path, d, score))

    results.sort(key=lambda x: x[2], reverse=True)
    return results[:limit]


def main():
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))

        tool  = data.get("tool_name", "").lower()
        inp   = data.get("tool_input", {})
        target = ""
        ctype  = ""

        if tool == "glob":
            pat  = inp.get("pattern", "")
            pth  = inp.get("path", "")
            target = f"{pth}/{pat}" if pth else pat
            ctype  = "glob"
        elif tool == "grep":
            target = inp.get("path", "") or inp.get("glob", "") or inp.get("pattern", "")
            ctype  = "grep"
        elif tool == "read":
            target = inp.get("file_path", "")
            ctype  = "read"
        elif tool in ("edit", "write"):
            target = inp.get("file_path", "")
            ctype  = "edit" if tool == "edit" else "write"

        if not (target and ctype):
            return 0

        index = load_index()
        index = track(index, target, ctype)
        save_index(index)

        # Inject hints for navigation (grep/glob only — not reads, too noisy)
        if ctype in ("grep", "glob"):
            hot = related_hot(index, target)
            if hot:
                parts = []
                for path, d, _ in hot:
                    name = Path(path).name
                    parts.append(f"{name}(w:{d['writes']} s:{d['searches']})")
                print(f"[GRAPHIFY] Hot near '{target}': {' | '.join(parts)}")

    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
