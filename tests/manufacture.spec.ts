import { test, expect } from "@playwright/test";
import { ManufacturePage } from "../pages/ManufacturePage";


function getConversionFactor(uom: string): number {
    const unitMap: Record<string, number> = { 'кг': 1000, 'л': 1000, 'шт': 1 };
    return unitMap[uom.toLowerCase()] || 1;
}

test('Производство: создание и проверка списаний', async ({ page }) => {
    test.setTimeout(120000); // 2 минуты
    const manufacture = new ManufacturePage(page);

    const STORAGE = "Склад Бар";
    const PRODUCT_NAME = "П/Ф сахарный сироп";
    const DATE = "10.10.2025";
    const tolerance = 1;

    // 1️ Открываем Производство и создаём накладную
    await manufacture.openList();
    await manufacture.goToCreateForm();
    await manufacture.selectInvoiceDate(DATE);
    await manufacture.selectStorage(STORAGE, "storage-id");

    // 2️ Выбираем продукт
    await manufacture.selectProduct(PRODUCT_NAME);

    // 3️ Получаем список компонентов из UI
    const components = await manufacture.getComponentsFromUI();
    const filteredComponents = components.filter(c => c.name !== PRODUCT_NAME);
    console.log("📦 Используемые ингредиенты:", components);


    // 4️ Сохраняем начальные остатки по каждому ингредиенту
    const initialData: Record<string, { amount: number; uom: string }> = {};
    for (const comp of components) {
        const data = await manufacture.getProductAmountsByStorages(comp.name);
        initialData[comp.name] = {
            amount: data.amounts[STORAGE],
            uom: data.uom
        };
    }

    // Также получаем начальный остаток готового продукта
    const outputData = await manufacture.getProductAmountsByStorages(PRODUCT_NAME);
    const initialOutputAmount = outputData.amounts[STORAGE];

    // 5️ Сохраняем производство
    await manufacture.openList();
    await manufacture.goToCreateForm();
    await manufacture.selectInvoiceDate(DATE);
    await manufacture.selectStorage(STORAGE, "storage-id");
    await manufacture.selectProduct(PRODUCT_NAME);
    await manufacture.save();

    for (const comp of filteredComponents) {
        const after = await manufacture.getProductAmountsByStorages(comp.name);
        const factor = getConversionFactor(comp.uom);
        const expectedDecrease = comp.amount * factor;
        const actualDecrease = initialData[comp.name].amount - after.amounts[STORAGE];

        console.log(`🔹 ${comp.name}: ожидалось -${expectedDecrease}, факт -${actualDecrease}`);

        expect(Math.abs(actualDecrease - expectedDecrease)).toBeLessThanOrEqual(tolerance);
    }

    // 7️⃣ Проверяем — готовый продукт увеличился
    const afterOutput = await manufacture.getProductAmountsByStorages(PRODUCT_NAME);
    const actualIncrease = afterOutput.amounts[STORAGE] - initialOutputAmount;
    console.log(`✅ ${PRODUCT_NAME}: произведено +${actualIncrease}`);

    expect(actualIncrease).toBeGreaterThan(0);
});
