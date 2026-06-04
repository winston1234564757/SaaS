// MTRP audit tool — detect <button> tags missing type= / aria-label.
// Brace-depth aware: ignores '>' inside {...} (arrow funcs etc), so it does NOT
// suffer the false-negatives that a flat ripgrep multiline pattern does.
//
// USAGE (run from bookit/):  node ../XDEV/PLANS/MTRP/tools/scan-buttons.cjs
//
// Output: total tags, list of file:line missing type= (with [onClick]/[no-onClick] +
// [form?] hints), and tag-level aria-label gaps for manual triage.
//
// SAFETY NOTE for P0.5: do NOT blindly add type="button" everywhere — a form's
// submit button must stay type="submit". Buttons WITH onClick -> type="button"
// (safe). Buttons with NO onClick inside a <form> -> likely type="submit".
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

function findButtonTags(src) {
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
    res.push({ tag: src.slice(i, end + 1), index: i });
    i = end + 1;
  }
  return res;
}

const files = walk(ROOT);
let total = 0;
const missingType = [];
let missingAriaCount = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const hasForm = /<form\b/.test(src);
  for (const b of findButtonTags(src)) {
    total++;
    const line = src.slice(0, b.index).split('\n').length;
    if (!/\btype\s*=/.test(b.tag)) {
      const onClick = /\bonClick\s*=/.test(b.tag) ? 'onClick' : 'NO-onClick';
      missingType.push(`${f}:${line} [${onClick}]${hasForm ? ' [file-has-form]' : ''}`);
    }
    if (!/\baria-label\s*=/.test(b.tag) && !/\baria-labelledby\s*=/.test(b.tag)) missingAriaCount++;
  }
}
console.log('TOTAL <button> tags:', total);
console.log('MISSING type=:', missingType.length);
missingType.forEach(x => console.log('  T ' + x));
console.log('MISSING aria-label (tag-level; many have visible text — manual triage):', missingAriaCount);
