import { readFileSync, readdirSync } from 'fs';

const report = JSON.parse(readFileSync('playwright-report/report-data/report.json', 'utf8'));
console.log('STATS:', JSON.stringify(report.stats));
console.log('');

const files = readdirSync('playwright-report/report-data')
  .filter(f => f.endsWith('.json') && f !== 'report.json');

for (const f of files) {
  const d = JSON.parse(readFileSync(`playwright-report/report-data/${f}`, 'utf8'));
  for (const t of (d.tests || [])) {
    const s = t.outcome === 'expected' ? 'PASS' : t.outcome === 'skipped' ? 'SKIP' : 'FAIL';
    const path = (t.path || []).join(' › ');
    console.log(`${s}  ${path}${path ? ' › ' : ''}${t.title}`);
    if (s === 'FAIL') {
      for (const r of (t.results || [])) {
        for (const e of (r.errors || [])) {
          const msg = (e.message || '').split('\n')[0];
          console.log(`     ↳ ${msg}`);
        }
      }
    }
  }
}
