import { test, expect } from '@playwright/test';
import * as path from 'path';




const CI_AUTH_FILE = path.join(process.cwd(), 'ci-auth-long-life.json');


    test('Генерация локальный сессии (Ручной вход)', async ({page}) => {
        // Открываем сайт
        await page.goto('https://mn.fcs.baimly.dev/main');

        console.log('⏳ У вас 60 секунд, чтобы войти вручную (используйте CI-аккаунт).');


        // 3. Ожидаем, что страница перешла на главную
        await page.waitForSelector('text=Главная', { timeout: 85000 });

        // 4. Сохраняем сессию в файл
        await page.context().storageState({path: CI_AUTH_FILE});

        console.log(`✅ Долгоживущий CI-токен сохранен в ${CI_AUTH_FILE}.`);
        console.log('Этот файл должен быть загружен в Jenkins Credentials.');

    });