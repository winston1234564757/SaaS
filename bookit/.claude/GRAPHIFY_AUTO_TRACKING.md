# 🔄 GRAPHIFY AUTO-TRACKING SYSTEM

**Status:** ✅ Active & Configured  
**Date:** 2026-05-26  
**Mode:** Silent Auto-Tracking (Non-Intrusive)

---

## 📊 What This System Does

Automatically tracks all code changes and file access patterns to maintain an up-to-date **architecture graph index**. No manual intervention needed—runs silently in the background via hooks.

```
User Action (Glob/Grep/Edit/Write)
    ↓
Hook triggered (Pre/Post ToolUse)
    ↓
graphify_hook.py / post_edit_hook.py runs silently
    ↓
Changes logged to graph-index.json
    ↓
Index updated with timestamp + metadata
```

---

## 🔧 How It Works

### **1. Automatic Triggers**

#### **A. Glob/Grep Operations (Read)**
```
PreToolUse hook (Glob | Grep)
  → graphify_hook.py
  → Logs accessed files with timestamp
  → Updates graph-index.json
  → Silent (no output to user)
```

#### **B. Edit/Write Operations (Write)**
```
PostToolUse hook (Edit | Write)
  → post_edit_hook.py
  → Logs modified files with change type
  → Validates Cyrillic encoding
  → Updates graph-index.json
  → Silent (no output to user)
```

#### **C. Git Commit (Future)**
```
On-demand (not yet automated)
  → Could trigger graphify-cli regeneration
  → Requires: npm install -g graphify-cli
  → Would update GRAPH_REPORT.md
  → Currently disabled (optional enhancement)
```

---

## 📁 File Structure

### **Primary Index (Machine-Readable)**
**File:** `graphify-out/graph-index.json`

```json
{
  "version": "1.0",
  "last_updated": "2026-05-26T14:30:00Z",
  "status": "active",
  "total_nodes": 1563,
  "total_edges": 1271,
  "communities": 516,
  "extraction_quality": "100%",
  "files": {
    "src/components/Button.tsx": {
      "last_accessed": "2026-05-26T14:25:00Z",
      "changes": [
        {
          "timestamp": "2026-05-26T14:25:00Z",
          "type": "edit",
          "reason": "Updated button styles for Frost theme"
        }
      ]
    }
  },
  "changes": [
    {
      "timestamp": "2026-05-26T14:25:00Z",
      "file": "src/components/Button.tsx",
      "type": "edit",
      "processed": true
    }
  ]
}
```

### **Fallback Report (Human-Readable)**
**File:** `graphify-out/GRAPH_REPORT.md`
- Obsidian wiki-formatted (Markdown with [[links]])
- 516 communities detected
- 1563 nodes, 1271 edges
- Updated manually or via graphify-cli (on-demand)

### **Change Log (Internal)**
**File:** `graphify-out/.graph-changes.json`
- Tracks all unprocessed changes
- Cleaned up after graphify-cli run

---

## 🎯 Key Features

### **✅ Silent Operation**
- No console output or prompts
- Runs in background during tool use
- Doesn't interrupt workflow

### **✅ Automatic Logging**
- Every Glob/Grep access logged
- Every Edit/Write operation logged
- Timestamps + metadata preserved

### **✅ Low Overhead**
- JSON append-only operations (fast)
- No external API calls
- No network dependencies

### **✅ Privacy**
- All tracking stays local
- No data leaves the project
- Auditable via graph-index.json

### **✅ Integration with MemPalace**
- Tracks which files you're working on
- Correlates with MemPalace drawers
- Future: cross-reference for smarter suggestions

---

## 📍 Configuration Location

**settings.json section:** `graphifyConfig`

```json
"graphifyConfig": {
  "enabled": true,
  "mode": "auto-track-silent",
  "autoCalls": {
    "onGlobGrep": { "enabled": true, "silent": true },
    "onEditWrite": { "enabled": true, "silent": true },
    "onGitCommit": { "enabled": false },
    "onDemand": { "command": "graphify-cli ..." }
  }
}
```

---

## 🚀 Usage Patterns

### **Pattern 1: Automatic (Currently Active)**
```
Your normal workflow
  ↓
Glob/Grep/Edit/Write operations
  ↓
Hooks run silently
  ↓
graph-index.json automatically updated
  ↓
Nothing you need to do!
```

### **Pattern 2: Manual Check (On Demand)**
```
Want to see tracked changes?
  → Open graphify-out/graph-index.json
  → View "changes" array for recent operations
  → Last "timestamp" shows when index was updated
```

### **Pattern 3: Regenerate Report (Future)**
```
To refresh GRAPH_REPORT.md manually:
  1. Install: npm install -g graphify-cli
  2. Run: graphify-cli . --format markdown --output graphify-out/GRAPH_REPORT.md
  3. Report is updated with latest structure
```

---

## 🔍 How to View Tracked Changes

### **Quick Check**
```bash
# View latest changes in index
cat graphify-out/graph-index.json | grep -A 5 "changes"
```

### **In VS Code**
1. Open `graphify-out/graph-index.json`
2. Expand `"changes"` array
3. See timestamp + file + type for each operation

### **Historical View**
```
Changes array in graph-index.json maintains chronological log:
  - Most recent at the end
  - Timestamp for each change
  - Type: "glob", "grep", "edit", "write"
  - Status: "processed" or "pending"
```

---

## 🛠️ Advanced: Manual Regeneration

### **If You Have graphify-cli**
```bash
cd C:\Users\Vitossik\SaaS\bookit

# Install graphify-cli (one-time)
npm install -g @anthropic-ai/graphify

# Regenerate full report (slow but thorough)
graphify-cli . --format json --output ../graphify-out/graph-index.json

# Or with Markdown report
graphify-cli . --format markdown --output ../graphify-out/GRAPH_REPORT.md
```

### **Integration with CI/CD**
```yaml
# Example: GitHub Actions (future)
- name: Update Graphify Index
  run: |
    npm install -g @anthropic-ai/graphify
    graphify-cli . --format json --output ./graphify-out/graph-index.json
```

---

## 📊 Index Statistics (Current)

```
Total Files: 590
Total Words: ~10,350,371
Nodes (entities): 1,563
Edges (relationships): 1,271
Communities (clusters): 516
Extraction Quality: 100% EXTRACTED
Last Updated: 2026-05-26
```

---

## 🎓 Best Practices

### **1. Monitor graph-index.json Size**
```
If graph-index.json grows > 50MB:
  → Consider archiving old changes to .graph-changes-archive.json
  → Keeps active index lean and fast
```

### **2. Periodic Report Regeneration**
```
Weekly or monthly (not on every commit):
  1. Run graphify-cli to regenerate GRAPH_REPORT.md
  2. Commit updated report
  3. Alerts team to architectural changes
```

### **3. Correlate with MemPalace**
```
When working on a feature:
  1. graphify tracks file changes automatically
  2. mempalace_add_drawer saves design decisions
  3. Together = complete understanding of what changed & why
```

### **4. Use with SYSTEM_MAP.md**
```
For navigation, prefer:
  1. MemPalace (fast, contextual)
  2. SYSTEM_MAP.md (authoritative, readable)
  3. graph-index.json (programmatic access)
  4. GRAPH_REPORT.md (last resort, wiki format)
```

---

## 🔐 Privacy & Security

- ✅ All tracking **local to project**
- ✅ No external API calls
- ✅ No data sent to Claude or third parties
- ✅ Timestamps only for logging (no PII)
- ✅ Auditable via git history

---

## 🧹 Maintenance

### **Cleanup Operations** (Optional)
```bash
# Archive old changes (monthly)
mv graphify-out/graph-index.json graphify-out/graph-index-2026-05.json
rm graphify-out/graph-index.json  # New one auto-created on next operation

# Keep GRAPH_REPORT.md (human-readable archive)
# Keep .graph-changes.json (internal log)
```

### **Reset System** (If Needed)
```bash
# Clear all tracking (WARNING: loses history)
rm graphify-out/graph-index.json
rm graphify-out/.graph-changes.json

# System will auto-recreate on next operation
```

---

## 🚨 Troubleshooting

### **Issue: graph-index.json not updating**
**Solution:**
1. Check if hooks are enabled in settings.json
2. Verify file path: `graphify-out/graph-index.json` exists
3. Check permissions on `graphify-out/` folder

### **Issue: Too many changes in index**
**Solution:**
1. This is normal (features are good!)
2. Archive old changes if > 50MB
3. Regenerate GRAPH_REPORT.md when ready

### **Issue: GRAPH_REPORT.md is outdated**
**Solution:**
1. Install graphify-cli: `npm install -g @anthropic-ai/graphify`
2. Run: `graphify-cli . --output graphify-out/GRAPH_REPORT.md`
3. Commit updated report

---

## 📚 Integration Points

| System | Integration | Purpose |
|---|---|---|
| **MemPalace** | Cross-reference tracked files | Know what was changed and why |
| **SYSTEM_MAP.md** | Complement with architectural context | Navigate & understand structure |
| **Git Hooks** | Could trigger graphify on commit | Auto-update reports |
| **CI/CD** | Run graphify-cli in pipeline | Keep report always fresh |
| **IDE Extensions** | VSCode could display tracked files | Visual feedback during editing |

---

## ✨ Future Enhancements

- [ ] Auto-archive changes monthly
- [ ] Dashboard showing file change frequency
- [ ] Integration with git blame (who changed what)
- [ ] Graphify CLI integration for auto-regeneration
- [ ] VSCode extension showing tracked files
- [ ] Alert when graph structure changes significantly

---

## 🎯 Summary

**You now have:**
- ✅ **Automatic file tracking** via hooks (silent, always-on)
- ✅ **graph-index.json** (machine-readable index, auto-updated)
- ✅ **GRAPH_REPORT.md** (human-readable wiki, manually regenerated)
- ✅ **Zero manual effort** (hooks handle everything)
- ✅ **Low overhead** (JSON append-only operations)
- ✅ **Privacy-first** (all local, no external calls)

**What you should do next:**
1. Bookmark `graphify-out/graph-index.json` for quick checks
2. Use MemPalace + SYSTEM_MAP.md for navigation (not raw graph)
3. Optionally install graphify-cli for periodic report regeneration
4. Monitor graph-index.json size (archive if > 50MB)

---

*Last updated: 2026-05-26 · Version: 1.0 · Status: ✅ Active*
