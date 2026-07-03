import { chromium } from 'playwright';

const url = process.env.SHOT_URL || 'http://localhost:3000/dossier-preview';
const out = process.env.SHOT_OUT || 'dossier-preview.png';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('shot →', out);
