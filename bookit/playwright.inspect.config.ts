import { defineConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, 'e2e/inspect/.auth/session.json');
const hasAuth   = fs.existsSync(AUTH_FILE);

export default defineConfig({
  testDir: './e2e/inspect',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    timezoneId: 'Europe/Kyiv',
    screenshot: 'on',
    trace: 'off',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    channel: 'chrome',
    ...(hasAuth ? { storageState: AUTH_FILE } : {}),
  },
  projects: [
    {
      name: 'chrome',
      use: {
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
