---
name: self-improving-agent
description: Session memory curator — extract key decisions/fixes from this session and save to MemPalace. Use at session end, after major features, after fixing critical bugs, or before context compaction. AUTO-TRIGGERED by Stop hook when >= 3 edits detected.
version: "1.0.0"
---

# Self-Improving Agent — Memory Curator

Curates MemPalace at end of session. Extracts novel knowledge from the session
and saves it as structured drawers.

---

## Sub-commands

### /self-improving-agent extract
Extract all key learnings from this session:

1. Scan conversation for:
   - Technical decisions (architecture, approach choices)
   - Bug fixes (root cause + fix)
   - New patterns (code, RLS, design)
   - Breaking changes or API changes
   - Performance findings
2. For each item: call `mempalace_add_drawer` with structured content
3. Report: "Memory updated: N drawers added"

### /self-improving-agent promote
Promote session insights without duplicates:

1. For each candidate: `mempalace_check_duplicate`
2. If exists: `mempalace_update_drawer`
3. If new: `mempalace_add_drawer`
4. Report changes

### /self-improving-agent remember [thing]
Save one specific piece of knowledge immediately:

```
/self-improving-agent remember "RLS fix: clients need service_role for notifications"
```

1. Format as structured drawer
2. `mempalace_check_duplicate` first
3. `mempalace_add_drawer` if new / `mempalace_update_drawer` if exists

### /self-improving-agent status
Show current MemPalace state:

1. `mempalace_status` → total drawers, wings
2. Show top rooms by size
3. Suggest: "Areas needing update based on this session"

### /self-improving-agent review
Review what was learned in this session (without saving):

1. Summarize session changes
2. List candidate drawers
3. Ask: "Save these N items to MemPalace? [yes/no]"

---

## Drawer Format (for mempalace_add_drawer)

```
wing: bookit
room: technical | architecture | fixes | decisions
name: <kebab-case-slug>
body: |
  ## Summary
  [1-2 sentences]
  
  ## Context
  [Why this matters]
  
  ## Solution/Decision
  [What was done]
  
  ## Key files
  [path:line if relevant]
  
  ## Watch out
  [Gotchas, edge cases]
```

---

## Auto-Trigger Protocol

This skill is automatically triggered by `self_improving_hook.py` when:
- Session Stop event fires
- `edit_counts` total >= 3 in `session_state.json`

When triggered, Claude MUST:
1. Run `/self-improving-agent extract` (no exceptions)
2. Complete MemPalace update before session ends
3. Update SYSTEM_MAP.md if architecture changed

---

## Marketplace Version

After `/plugin install self-improving-agent@claude-code-skills`:
- Enhanced extract with conversation analysis agents
- Automatic promotion scoring
- Session diff visualization
- Integration with MemPalace tunnels
