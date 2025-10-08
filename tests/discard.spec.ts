import { test , expect} from "@playwright/test";
import {DiscardPage} from "../pages/DiscardPage";

function getConversionFactor(uom: string): number {
    const unitMap: Record<string, number> = {
        // Если ввод в UI - это 'кг', а система хранит в граммах, коэффициент = 1000.
        'кг': 1000,
        'л': 1000,
        'шт': 1,
    };

    return unitMap[uom.toLowerCase()] || 1;
}

test.describe('Списание', () => {
    test('Новое списание', async ({page}) => {
       const discard = new DiscardPage(page);

        const productName = 'Кофе для эспрессо без кофеина';
        const discardAmount = 3; // Количество для списания (в кг/шт)
        const storageToDiscardFrom = 'Склад Бар'; // Склад, с которого списываем
        const reason = 'Бесплатное кофе';
        const date = '15.09.2025';

        await discard.goToProductsPage(); // Переходим на страницу остатков
        const initialData = await discard.getProductAmountsByStorages(productName);

        const initialStorageAmount = initialData.amounts[storageToDiscardFrom];
        const uom = initialData.uom;

        const UNIT_CONVERSION_FACTOR = getConversionFactor(uom);

        expect(initialStorageAmount, `ERROR: Не найдено начальное количество для склада: ${storageToDiscardFrom}.`).not.toBeUndefined();

        await discard.openList();
       await discard.goToCreateForm();

        await discard.selectInvoiceDate(date);

        await discard.selectStorage(storageToDiscardFrom);
        await discard.selectReason(reason);


        await discard.addProduct(productName, discardAmount);

        await discard.save();



        await discard.goToProductsPage();

        const finalData = await discard.getProductAmountsByStorages(productName);


        const finalStorageAmount = finalData.amounts[storageToDiscardFrom];



        const expectedDecreaseInSystemUnits = discardAmount * UNIT_CONVERSION_FACTOR;
        const expectedFinalAmount = initialStorageAmount - expectedDecreaseInSystemUnits;

        expect(finalStorageAmount, `Остаток на складе ${storageToDiscardFrom} должен уменьшиться на ${discardAmount} единиц.`)
            .toBe(expectedFinalAmount);

        console.log(`\n--- ПРОВЕРКА СПИСАНИЯ УСПЕШНА ---`);
        console.log(`✅ ${storageToDiscardFrom}: Было ${initialStorageAmount}, списано ${discardAmount} ед. (${expectedDecreaseInSystemUnits} системных ед.), стало ${finalStorageAmount} (Ожидалось ${expectedFinalAmount}). OK.`);
        console.log('-------------------------------------\n');
    });
})