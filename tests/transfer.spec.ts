import { test , expect} from "@playwright/test";
import {TransferPage} from "../pages/TransferPage";

function getConversionFactor(uom: string): number {
    const unitMap: Record<string, number> = {
        // Если ввод в UI - это 'кг', а система хранит в граммах, коэффициент = 1000.
        'кг': 1000,
        'л': 1000,
        'шт': 1,
    };

    return unitMap[uom.toLowerCase()] || 1;
}

test.describe('Перемещение', () => {
    test('Новое перемешение', async ({page}) => {
        const transfer = new TransferPage(page);

        const productName = 'Заготовка ягодный';
        const transferAmount = 3;

        const sourceStorage = 'Склад Магазин';
        const destinationStorage = 'Склад Бар';


        await transfer.goToProductsPage();
        const initialData = await transfer.getProductAmountsByStorages(productName);

        const initialSourceAmount = initialData.amounts[sourceStorage];
        const initialDestinationAmount = initialData.amounts[destinationStorage];
        const uom = initialData.uom;


        const UNIT_CONVERSION_FACTOR = getConversionFactor(uom);

        // Расчет изменения в системных единицах (например, 3 * 1000 = 3000)
        const expectedChangeInSystemUnits = transferAmount * UNIT_CONVERSION_FACTOR;


        expect(initialSourceAmount, `ERROR: Не найдено начальное количество для склада: ${sourceStorage}. Проверьте локатор и название склада.`).not.toBeUndefined();
        expect(initialDestinationAmount, `ERROR: Не найдено начальное количество для склада: ${destinationStorage}`).not.toBeUndefined();

        await transfer.openList();
        await transfer.goToCreateForm();
        await transfer.selectInvoiceDate();

        await transfer.selectStorage(sourceStorage, 'storage-id');
        await transfer.selectStorage(destinationStorage, 'tostorage-id');

        await transfer.addProduct(productName, transferAmount);
        await transfer.save();


        // 3. СБОР КОНЕЧНЫХ ДАННЫХ
        await transfer.goToProductsPage();
        // 🚨 ИЗМЕНЕНИЕ: Снова ожидаем объект { amounts, uom }
        const finalData = await transfer.getProductAmountsByStorages(productName);

        const finalSourceAmount = finalData.amounts[sourceStorage];
        const finalDestinationAmount = finalData.amounts[destinationStorage];


        console.log(`\n--- ПРОВЕРКА ОСТАТКОВ ТОВАРА "${productName}" ---`);

        // Проверка склада-источника
        expect(finalSourceAmount, `Остаток на складе ${sourceStorage} должен уменьшиться`).toBe(initialSourceAmount - transferAmount);
        console.log(`✅ ${sourceStorage}: Было ${initialSourceAmount}, стало ${finalSourceAmount}. Уменьшение на ${transferAmount} OK.`);

        // Проверка склада-получателя
        expect(finalDestinationAmount, `Остаток на складе ${destinationStorage} должен увеличиться`).toBe(initialDestinationAmount + transferAmount);
        console.log(`✅ ${destinationStorage}: Было ${initialDestinationAmount}, стало ${finalDestinationAmount}. Увеличение на ${transferAmount} OK.`);

        console.log('--- ПРОВЕРКА ТРАНСФЕРА УСПЕШНО ЗАВЕРШЕНА ---\n');




    })
})