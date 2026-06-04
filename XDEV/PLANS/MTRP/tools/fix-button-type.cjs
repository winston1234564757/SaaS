// MTRP codemod (P0.5) — insert type="button" into <button> tags that have onClick
// but no type=. Brace-depth aware (same parser as scan-buttons.cjs), so it never
// mis-parses arrow funcs and never double-adds. Pure ASCII insert -> Cyrillic safe.
//
// SAFETY: skips buttons WITHOUT onClick (potential form submits -> manual review)
// and buttons that already have type=. Inserts inline (no new lines).
//
// USAGE (from bookit/):  node ../XDEV/PLANS/MTRP/tools/fix-button-type.cjs
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
function buttonTags(src) {
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
    res.push({ start: i, end: end + 1, tag: src.slice(i, end + 1) });
    i = end + 1;
  }
  return res;
}

let fixed = 0;
const skipped = [];
for (const f of walk(ROOT)) {
  let src = fs.readFileSync(f, 'utf8');
  const tags = buttonTags(src);
  let changed = false;
  for (let k = tags.length - 1; k >= 0; k--) { // end->start keeps indices valid
    const t = tags[k];
    if (/\btype\s*=/.test(t.tag)) continue;
    if (!/\bonClick\s*=/.test(t.tag)) {
      const line = src.slice(0, t.start).split('\n').length;
      skipped.push(`${f}:${line} [NO-onClick]`);
      continue;
    }
    src = src.slice(0, t.start + 7) + ' type="button"' + src.slice(t.start + 7);
    changed = true; fixed++;
  }
  if (changed) fs.writeFileSync(f, src);
}
console.log('FIXED type="button" (onClick buttons):', fixed);
console.log('SKIPPED [NO-onClick] (manual review):', skipped.length);
skipped.forEach(s => console.log('  ' + s));
