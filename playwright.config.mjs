import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  reporter: [['list']],
  use: {baseURL: 'http://127.0.0.1:4321/', channel: 'chrome', headless: true, acceptDownloads: true},
  webServer: {
    command: 'npm run build -- --session tests/fixtures/learning/session.valid.json && npm run serve -- --port 4321',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
