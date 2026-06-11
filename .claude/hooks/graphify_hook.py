#!/usr/bin/env python3
"""
GRAPHIFY_HOOK — PreToolUse (Glob|Grep):
Injects hot-file hints when navigating near frequently-edited areas.
Tracking is done by graphify_post_hook (PostToolUse) for real file paths.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path("C:/Users/Vitossik/SaaS")
GRAPHIFY_OUT = PROJECT_ROOT / "graphify-out"
GRAPH_INDEX  = GRAPHIFY_OUT / "graph-index.json"

HOT_WRITES   = 4
HOT_SEARCHES = 8
MAX_CHANGES  = 500


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


def _track(index, filepath: str, change_type: str):
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


def track_file(filepath: str, change_type: str):
    """Public helper — load index, track one file, save. Used by other hooks."""
    try:
        index = load_index()
        index = _track(index, filepath, change_type)
        save_index(index)
    except Exception:
        pass


def related_hot(index, query: str, limit=4):
    """Files whose path overlaps with query keywords AND are hot."""
    q = query.lower()
    keywords = [k for k in q.replace("/", " ").replace("\\", " ").replace(".", " ").replace("*", " ").split() if len(k) > 3]
    if not keywords:
        return []

    results = []
    for path, d in index.get("files", {}).items():
        pl = path.lower()
        if any(k in pl for k in keywords):
            score = d.get("writes", 0) * 3 + d.get("searches", 0)
            if d.get("writes", 0) >= HOT_WRITES or d.get("searches", 0) >= HOT_SEARCHES:
                results.append((path, d, score))

    results.sort(key=lambda x: x[2], reverse=True)
    return results[:limit]


def main():
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8", errors="replace"))

        inp    = data.get("tool_input", {})
        tool   = data.get("tool_name", "").lower()

        if tool == "glob":
            query = f"{inp.get('path', '')}/{inp.get('pattern', '')}"
        elif tool == "grep":
            query = inp.get("path", "") or inp.get("glob", "") or inp.get("pattern", "")
        else:
            return 0

        # Hints only — no tracking here (PostToolUse tracks real files)
        index = load_index()
        hot = related_hot(index, query)
        if hot:
            parts = []
            for path, d, _ in hot:
                name = Path(path).name
                parts.append(f"{name}(w:{d.get('writes',0)} s:{d.get('searches',0)})")
            print(f"[GRAPHIFY] Hot near '{query}': {' | '.join(parts)}")

    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
