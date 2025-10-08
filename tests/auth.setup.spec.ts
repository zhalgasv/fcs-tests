import { test, expect } from '@playwright/test';

test('login and save storage state', async ({ page }) => {
    // Открываем сайт
    await page.goto('http://localhost:4400/main');

    // Тут нужно вручную авторизоваться (например, через Telegram)
    // Ждём пока появится главная страница после входа


    // 15 секунд, чтобы успеть ввести код
    await page.waitForTimeout(15000);

    await page.waitForURL('**/main');//
    // Сохраняем сессию в файл
    await page.context().storageState({ path: 'auth.json' });
});
