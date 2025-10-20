import inquirer from "inquirer";
import { execSync} from "node:child_process";

const choices = [
    "🧪 Все тесты",
    "📦 Supply",
    "⚙️ Manufacture",
    "📤 Transfer",
    "🚮 Discard",
];

const { choice } = await inquirer.prompt([
    {
        type: "checkbox",
        name: "choice",
        message: "Выберите, какие тесты запустить:",
        choices,
    },
]);

if (choice.length === 0) {
    console.log("❌ Ничего не выбрано, выход...");
    process.exit(0);
}

try {
    console.log(`🚀 Запускаю тесты: ${choice.join(", ")} ...`);
    execSync(`npx playwright test ${choice.join(" ")}`, { stdio: "inherit" });
    console.log("✅ Все тесты успешно прошли!");
} catch (err) {
    if (err instanceof Error) {
        console.log("❌ Ошибка при выполнении тестов:", err.message);
    } else {
        console.log("❌ Неизвестная ошибка:", err);
    }
}
