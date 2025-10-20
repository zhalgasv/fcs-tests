import {execSync} from "node:child_process";

try {
    console.log("🚀 Запуск всех тестов Playwright...");
    // Запускаем все тесты
    execSync('npx playwright test --project=chromium --workers=1', {stdio: "inherit"});
    console.log("✅ Все тесты успешно прошли!");
} catch (err) {
    console.error("❌ Ошибка при выполнении тестов:", (err as Error).message);
    process.exit(1);
}
