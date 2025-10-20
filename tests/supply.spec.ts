import { test, Page, expect } from "@playwright/test";
import { SupplyPage} from "../pages/SupplyPage";




test.describe('Поставка товаров', () => {
    test('Создание новой поставки', async ({page}) => {
        const supply = new SupplyPage(page);

        const productName = 'Молоко кокосовое';
        const purchaseAmount = 10;
        const unitPrice = 300;
        const destinationStorage = 'Склад Бар';

        const UNIT_CONVERSION_FACTOR = 1000;

        await supply.goToProductsPage();
        const initialAmounts = await supply.getProductAmountsByStorages(productName);

        const initialDestinationAmount = initialAmounts.amounts[destinationStorage];

        expect(initialDestinationAmount, `ERROR: Не найдено начальное количество для склада: ${destinationStorage}.`).not.toBeUndefined();


        await supply.openList();

        await supply.goToCreateForm();

        await supply.selectInvoiceDate('2025-09-08');
        await page.keyboard.press('Escape');
// или кликнуть в body
        await page.click('body', { position: { x: 0, y: 0 } });

        await supply.selectSupplier('ИП АРНА')
        await supply.addProduct(productName, purchaseAmount, unitPrice);
        await supply.selectWarehouse(destinationStorage);

        await supply.save();

        await supply.goToProductsPage();
        const finalAmounts = await supply.getProductAmountsByStorages(productName);

        const finalDestinationAmount = finalAmounts.amounts[destinationStorage];


        const expectedIncreaseInSystemUnits = purchaseAmount * UNIT_CONVERSION_FACTOR;
        const expectedFinalAmount = initialDestinationAmount + expectedIncreaseInSystemUnits;

        expect(finalDestinationAmount, `Остаток на складе ${destinationStorage} должен увеличиться на ${purchaseAmount} кг ( ${expectedIncreaseInSystemUnits} г).`)
            .toBe(expectedFinalAmount);

        console.log(`✅ ${destinationStorage}: Было ${initialDestinationAmount}, поступило ${purchaseAmount} кг (${expectedIncreaseInSystemUnits} г), стало ${finalDestinationAmount} (Ожидалось ${expectedFinalAmount}). OK.`);



    })

})