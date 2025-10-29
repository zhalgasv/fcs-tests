import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

const AUTH_FILE_PATH = process.env.CI_AUTH_PATH || 'ci-auth-long-life.json';
console.log(`Используется файл аутентификации: ${AUTH_FILE_PATH}`);

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://mn.fcs.baimly.dev';
console.log(`Base URL: ${BASE_URL}`);

// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({

  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

    testIgnore: '**/tests/auth.ci.token.generator.spec.ts',
  /* Opt out of parallel tests on CI. */
  workers: 1,
    outputDir:'test-results',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
      video:'on',
      screenshot: 'only-on-failure',
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',
      baseURL: BASE_URL,
      storageState: AUTH_FILE_PATH,
      headless: true,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
      {
          name: 'setup',
          testMatch: /.*\.setup\.ts/,
          use: { headless: true }, // выполняет только setup-тесты
      },
    {
        name: 'chromium',
        // Использует настройки из глобального 'use' (включая storageState)
        use: { ...devices['Desktop Chrome'] },
        // КЛЮЧЕВОЙ МОМЕНТ: Зависимость гарантирует, что 'setup' будет выполнен первым
        dependencies: ['setup'],
        // Игнорируем setup-файл, так как он уже выполнен
        testIgnore: [/.*\.setup\.(ts|spec\.ts)/,
        '**/tests/auth.ci.token.generator.spec.ts',
         ],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: 'auth.json' },
    //     dependencies: ['setup'],
    // },
    //
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], storageState: 'auth.json' },
    //     dependencies: ['setup'],
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
