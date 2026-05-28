import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createUnzip } from 'zlib';
import { Writable } from 'stream';

const html = readFileSync('playwright-report/index.html', 'utf8');
const match = html.match(/data:application\/zip;base64,([A-Za-z0-9+/=]+)/);
if (!match) { console.log('No zip data found'); process.exit(1); }

const buf = Buffer.from(match[1], 'base64');
writeFileSync('playwright-report/report-data.zip', buf);
console.log('ZIP extracted, size:', buf.length, 'bytes');
