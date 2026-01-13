import { test, expect } from '@playwright/test';
import * as path from 'path';

test('manual login and save session', async ({ page }) => {
    test.setTimeout(120_000);

    const authFile = path.resolve(process.cwd(), 'ci-auth-long-life.json');

    await page.goto('https://mn.alarify.dev');

    console.log('⏳ 90 секунд на ручной логин...');


    await page.waitForFunction(() => {
        const el = document.querySelector('nz-page-header-title');
        return el && el.textContent?.trim() === 'Поставщики';
    }, { timeout: 85_000 });

    await page.context().storageState({ path: authFile });

    console.log('✅ Session сохранена:', authFile);
});
