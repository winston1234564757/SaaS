# Graphify Graph Index

**Status:** Active (Auto-tracked)  
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Index Structure

- `graph-index.json` — Machine-readable graph index (JSON)
- `GRAPH_REPORT.md` — Obsidian wiki-formatted report (human-readable)
- `.graph-changes.json` — Change log (internal)

## How It Works

1. **Glob/Grep** triggers `graphify_hook.py` → logs files accessed
2. **Edit/Write** triggers `post_edit_hook.py` → logs files modified
3. Changes accumulated in `graph-index.json` (changes array)
4. On-demand: run graphify-cli to regenerate full report

## Integration Points

- **Hook:** PreToolUse (Glob|Grep) → graphify_hook.py
- **Hook:** PostToolUse (Edit|Write) → post_edit_hook.py
- **Command:** `npm run graphify` (future: auto-regenerate)

## For Navigation

Use **MemPalace + SYSTEM_MAP.md** instead of raw graph for project navigation.

