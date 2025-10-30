import {test, expect} from "@playwright/test";
import {ConversionPage} from "../pages/ConversionPage";

// --- Универсальная функция для расчета коэффициента ---
function getConversionFactor(uom: string): number {
    const unitMap: Record<string, number> = {
        'кг': 1000,
        'л': 1000,
        'шт': 1,
    };
    return unitMap[uom.toLowerCase()] || 1;
}

test.describe('Конвертация/Переработка', () => {
    test('Создание конвертации и проверка списания входного продукта', async ({ page }) => {
        const conversion = new ConversionPage(page);

        // --- Тестовые данные ---
        const INPUT_PRODUCT_NAME = 'Сироп карамель';     // Сырье (списывается)
        const OUTPUT_PRODUCT_NAME = 'Сироп ваниль';      // Конечный продукт (приходуется)
        const SOURCE_STORAGE = 'Склад Бар';
        const DESTINATION_STORAGE = 'Склад Бар';
        const FORMULA_NAME = 'Сироп карамель - Сироп ваниль';
        const AMOUNT_TO_CONVERT = 5;                     // Сколько сырья списываем (в UI-ед.)
        const EXPECTED_AMOUNT_PRODUCED = 5;              // Ожидаемый расчет Output (если формула 1:1)
        const date = '15.10.2025';


        // --- 1. ARRANGE: Получение начальных остатков (Input и Output) ---

        // 1.1. Получаем данные для ВХОДЯЩЕГО ПРОДУКТА (СПИСАНИЕ)
        await conversion.goToProductsPage();
        const initialInputData = await conversion.getProductAmountsByStorages(INPUT_PRODUCT_NAME);
        const initialInputAmount = initialInputData.amounts[SOURCE_STORAGE] || 0;
        const inputUom = initialInputData.uom;

        const inputConversionFactor = getConversionFactor(inputUom);
        const expectedInputDecrease = AMOUNT_TO_CONVERT * inputConversionFactor;
        const expectedFinalInputAmount = initialInputAmount - expectedInputDecrease;
        expect(initialInputAmount, `Ошибка: Не найден начальный остаток для списания ${INPUT_PRODUCT_NAME}.`).not.toBeUndefined();


        // 1.2. Получаем данные для КОНЕЧНОГО ПРОДУКТА (ПРИХОД)
        await conversion.goToProductsPage();
        const initialOutputData = await conversion.getProductAmountsByStorages(OUTPUT_PRODUCT_NAME);
        const initialOutputAmount = initialOutputData.amounts[DESTINATION_STORAGE] || 0;
        const outputUom = initialOutputData.uom;

        // Расчет прихода Output на основе ОЖИДАЕМОГО рассчитанного значения
        const outputConversionFactor = getConversionFactor(outputUom);
        const expectedOutputIncrease = EXPECTED_AMOUNT_PRODUCED * outputConversionFactor;
        const expectedFinalOutputAmount = initialOutputAmount + expectedOutputIncrease;


        // --- 2. ACT: Создание накладной конвертации ---///

        await conversion.openList();
        await conversion.goToCreateForm();

        // Заполнение заголовка
        await conversion.selectInvoiceDate(date);
        await conversion.selectStorage(SOURCE_STORAGE, 'storage-id');
        await conversion.selectStorage(DESTINATION_STORAGE, 'tostorage-id');


        await conversion.selectFormula(FORMULA_NAME);


        //  ШАГ 1: Ждем появления таблицы Input
        await conversion.waitForInputTableVisible();

        // 2.3. Вводим количество для ВХОДЯЩЕГО продукта (СЫРЬЕ)
        await conversion.setOutputProductAmount(AMOUNT_TO_CONVERT);


        // ШАГ 2: Ждем, пока система рассчитает и покажет Output Table
        await conversion.waitForOutputTableVisible();

        // ШАГ 3: Читаем рассчитанное значение (ВМЕСТО ВВОДА)
        const actualAmountProduced = await conversion.getInputAmountFromUI();

        //  ПРОВЕРКА UI: Убеждаемся, что рассчитанное значение верно
        expect(actualAmountProduced, `Система должна была рассчитать Output как ${EXPECTED_AMOUNT_PRODUCED}.`)
            .toBe(EXPECTED_AMOUNT_PRODUCED);

        // УДАЛЕНО: Убрали лишний вызов setOutputProductAmount(AMOUNT_PRODUCED);

        await conversion.save();


        // --- 3. ASSERT: Проверка конечных остатков ---
        const tolerance = 10;

        // Проверка Input
        await conversion.goToProductsPage();
        const finalInputData = await conversion.getProductAmountsByStorages(INPUT_PRODUCT_NAME);
        const finalInputAmount = finalInputData.amounts[SOURCE_STORAGE];

        const inputDiff = Math.abs(finalInputAmount - expectedFinalInputAmount);
        expect(inputDiff,
            `Входящий продукт ${INPUT_PRODUCT_NAME} должен списаться примерно на ${expectedInputDecrease}. 
   Фактически списалось ${Math.abs(finalInputAmount - initialInputAmount)}.`)
            .toBeLessThanOrEqual(tolerance);


        // Проверка Output
        await conversion.goToProductsPage();
        const finalOutputData = await conversion.getProductAmountsByStorages(OUTPUT_PRODUCT_NAME);
        const finalOutputAmount = finalOutputData.amounts[DESTINATION_STORAGE];

        const outputDiff = Math.abs(finalOutputAmount - expectedFinalOutputAmount);
        expect(outputDiff,
            `Конечный продукт ${OUTPUT_PRODUCT_NAME} должен приходоваться примерно на ${expectedOutputIncrease}. 
   Фактически приходовалось ${Math.abs(finalOutputAmount - initialOutputAmount)}.`)
            .toBeLessThanOrEqual(tolerance);

        console.log(`\n--- ПРОВЕРКА КОНВЕРТАЦИИ УСПЕШНА ---`);
        console.log(`✅ Списание сырья (${INPUT_PRODUCT_NAME}): Было ${initialInputAmount}, стало ${finalInputAmount} (Ожидалось ${expectedFinalInputAmount}).`);
        console.log(`✅ Приход продукта (${OUTPUT_PRODUCT_NAME}): Было ${initialOutputAmount}, стало ${finalOutputAmount} (Ожидалось ${expectedFinalOutputAmount}). OK.`);
        console.log('--------------------------------------\n');
    });
});