const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto(`file://${path.resolve(__dirname, 'map_test.html')}`);
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();
