#!/usr/bin/env python3
"""
GRAPHIFY_HOOK — Auto-tracks code changes & maintains graph index
Runs on Glob/Grep operations to update architecture graph
"""

import os
import json
import sys
from datetime import datetime
from pathlib import Path

# Config
PROJECT_ROOT = Path("C:/Users/Vitossik/SaaS")
GRAPHIFY_OUT = PROJECT_ROOT / "graphify-out"
GRAPH_INDEX = GRAPHIFY_OUT / "graph-index.json"
CHANGES_LOG = GRAPHIFY_OUT / ".graph-changes.json"

def load_index():
    """Load existing graph index"""
    if GRAPH_INDEX.exists():
        try:
            with open(GRAPH_INDEX, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {
        "version": "1.0",
        "last_updated": None,
        "total_nodes": 0,
        "total_edges": 0,
        "files": {},
        "changes": []
    }

def track_file(filepath: str, change_type: str):
    """Track file change for graph update"""
    index = load_index()
    
    # Record change
    change = {
        "timestamp": datetime.now().isoformat(),
        "file": filepath,
        "type": change_type,  # "glob", "grep", "edit", "write"
        "processed": False
    }
    
    index["changes"].append(change)
    index["last_updated"] = datetime.now().isoformat()
    
    # Save index
    GRAPHIFY_OUT.mkdir(parents=True, exist_ok=True)
    with open(GRAPH_INDEX, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    
    return True

def get_changed_files():
    """Get unprocessed changes"""
    index = load_index()
    return [c for c in index.get("changes", []) if not c.get("processed")]

def main():
    """Main hook entry point"""
    # Silent operation — logs only if critical
    # In production, this would integrate with Graphify CLI
    return 0

if __name__ == "__main__":
    sys.exit(main())
