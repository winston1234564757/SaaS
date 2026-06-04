// MTRP audit tool (P0.6) — find icon-only <button> elements missing aria-label.
// Heuristic: button has NO aria-label/aria-labelledby AND its inner content, after
// stripping JSX tags <...> and {expressions}, is empty/whitespace -> icon-only.
// May false-positive on <button>{textVar}</button> — ALWAYS verify on read before editing.
//
// USAGE (from bookit/):  node ../XDEV/PLANS/MTRP/tools/scan-icon-buttons.cjs
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2] || 'src';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(tsx|jsx)$/.test(e.name)) files.push(p);
  }
  return files;
}
function openTags(src) {
  const res = [];
  let i = 0;
  while ((i = src.indexOf('<button', i)) !== -1) {
    const after = src[i + 7];
    if (after && /[A-Za-z0-9]/.test(after)) { i += 7; continue; }
    let depth = 0, j = i + 7, end = -1;
    while (j < src.length) {
      const c = src[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) { end = j; break; }
      j++;
    }
    if (end === -1) break;
    res.push({ tagStart: i, tagEnd: end + 1, tag: src.slice(i, end + 1) });
    i = end + 1;
  }
  return res;
}

let flagged = 0;
for (const f of walk(ROOT)) {
  const src = fs.readFileSync(f, 'utf8');
  for (const t of openTags(src)) {
    if (/\baria-label\s*=|\baria-labelledby\s*=/.test(t.tag)) continue;
    const close = src.indexOf('</button>', t.tagEnd);
    if (close === -1) continue;
    const inner = src.slice(t.tagEnd, close);
    const stripped = inner.replace(/<[^>]*>/g, '').replace(/\{[\s\S]*?\}/g, '').replace(/\s+/g, '');
    if (stripped === '') {
      const line = src.slice(0, t.tagStart).split('\n').length;
      const icons = [...inner.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map(m => m[1]);
      flagged++;
      console.log(`${f}:${line}  icons=[${[...new Set(icons)].join(',')}]`);
    }
  }
}
console.log('ICON-ONLY buttons missing aria-label (verify each):', flagged);
