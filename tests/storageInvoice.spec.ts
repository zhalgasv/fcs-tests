import { test, expect } from "@playwright/test";
import {InventoryPage } from "../pages/InventoryPage";


test.describe('StorageInvoice', () => {
    test('new StorageInvoice ', async ({page}) => {
        const storageInventory = new InventoryPage(page);

        await storageInventory.openList();
        await storageInventory.goToCreateForm();

        await storageInventory.selectShift('211');

        await storageInventory.selectStorage('Склад Бар')

        // await storageInventory.selectCategories(['Кофе']);
        // Pass a single-item array to the method.
        await storageInventory.selectCategories(['Магазин']);

        await storageInventory.saveInvoice();

        // await storageInventory.saveInvoice();
    })
})