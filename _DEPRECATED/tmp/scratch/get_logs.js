const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'testmaster@gmail.com');
  await page.fill('input[name="password"]', 'Test1234!');
  try {
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  } catch(e) {
    console.log("Login nav timeout or already logged in/error");
  }

  await page.goto('http://localhost:3000/dashboard/settings', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
