import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 50
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const authFile = path.resolve(process.cwd(), 'ci-auth-long-life.json');
    console.log('Auth file:', authFile);

    await page.goto('https://mn.alarify.dev');

    console.log('⏳ У тебя есть 90 секунд, чтобы войти вручную...');
    await page.waitForTimeout(90_000);

    // Проверка что логин реально произошёл
    await page.waitForFunction(() => {
        return document.cookie.length > 0 || localStorage.length > 0;
    });

    await context.storageState({ path: authFile });

    console.log('✅ Session сохранена в:', authFile);

    await browser.close();
})();
