import { Page, expect } from '@playwright/test';
import {ProductAmountsResult} from "./TransferPage";

export class SupplyPage {
    constructor(private page: Page) {}

    async openList() {
        await this.page.goto('/storage-invoices/purchase?byOrder=false');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Накладные');
    }

    async goToCreateForm(){
        await this.page.click('span:has-text("Добавить")');
        await expect(this.page).toHaveURL('/storage-invoices/purchase/new');
    }
    async selectInvoiceDate(date: string) {


        const [year, month, day] = date.split('-');
        const formattedDate = `${day}.${month}.${year}`;

        // Кликаем в инпут, чтобы открыть календарь
        await this.page.click('nz-date-picker[formcontrolname="incomingInvoiceDate"] input');

        const dropdown = this.page.locator('.ant-picker-dropdown');
        await expect(dropdown).toBeVisible();
    }


    async selectWarehouse(warehouse: string) {

        const warehouseInput = this.page.locator('[formcontrolname="storageId"]');
        await warehouseInput.click();
        const option = this.page.locator(`.ant-select-item-option-content`, { hasText: warehouse});
         await option.click();
    }


    async save(){
        await this.page.click('button:has-text("Сохранить")');
        await expect(this.page).toHaveURL(/\/storage-invoices\/purchase\?byOrder=false/);
    }


    async getLastInvoiceNumber(): Promise<string> {
        const lastRow = this.page.locator('table tbody tr').first();
        return (await lastRow.locator('td').nth(0).textContent())?.trim() || '';
    }

    async selectSupplier(name: string) {

        // await this.page.locator('[formcontrolname="supplierId"]').click();
         const supplierInput = this.page.locator('[formcontrolname="supplierId"] input.ant-select-selection-search-input');
        await supplierInput.click();

        const option = this.page.locator(`nz-option-item:has-text("${name}")`);
        await option.waitFor({ state: 'visible', timeout: 10000 });
       // await option.locator('.ant-select-item-option-content', { hasText: name }).click();
        await option.click();
    }


    async addProduct(name: string, qty: number, price?: number) { // 👈 Изменено: price теперь необязательный
        const productSelect = this.page.locator('bm-store-product-select');

        const productInput = productSelect.getByRole('textbox');
        await productInput.click();

        await productInput.fill(name);
        const desiredItem = this.page.locator('nz-option-item', {hasText: name})
        await desiredItem.click();

        // Предполагается, что у вас есть атрибут data-pw-product-row на <tr>
        const lastRow = this.page.locator('[data-pw-product-row]').last();

        // 3. Условное заполнение Цены
        if (price !== undefined) {
            await lastRow.locator('input[formcontrolname="value"]').fill(price.toString());
        }

        // 4. Заполнение Количества
        // ✅ Локатор привязан к последней строке и ищет поле ввода количества
        await lastRow.locator('input[formcontrolname="amount"]').fill(qty.toString());
    }

    async goToProductsPage(){
        await this.page.goto('/products');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Остатки товаров');
    }

    async filterProductsByName(productName: string) {
        const filterInput = this.page.locator('[data-pw-query-filter-input]');
        await filterInput.fill(productName);

        await expect(this.page.getByRole('link', { name: productName })).toBeVisible({ timeout: 10000 });

    }

    async getProductAmountsByStorages(productName: string): Promise<ProductAmountsResult> {
        await this.goToProductsPage();

        const filterInput = this.page.locator('[data-pw-query-filter-input]');
        await filterInput.fill(productName);
        await this.page.waitForTimeout(500);


        const productLink = this.page
            .locator('a', {hasText: new RegExp(`^\\s*${productName}\\s*$`, 'i')});

        await expect(productLink).toBeVisible({timeout: 10000});


        await productLink.scrollIntoViewIfNeeded();
        await productLink.click();

        // ждем переход на страницу продукта
        await this.page.waitForURL(/\/products\/.*\/view/, {timeout: 15000});

        const uomElement = this.page.locator('[data-pw-storage] [data-pw-storage-uom]').first();
        await expect(uomElement).toBeVisible({timeout: 15000});
        const uomText = await uomElement.innerText();
        const uom = uomText.trim();

        const storageTags = this.page.locator('[data-pw-storage]');
        const count = await storageTags.count();

        const result: Record<string, number> = {};

        for (let i = 0; i < count; i++) {
            const tag = storageTags.nth(i);

            const storageNameWithColon = await tag.locator('[data-pw-storage-title]').innerText();


            const storageName = storageNameWithColon
                .replace(':', '')
                .replace(/\s+/g, ' ')
                .trim();


            const amountText = await tag.locator('[data-pw-storage-amount]').innerText();
            const amount = parseInt(amountText.trim(), 10);


            if (storageName && !isNaN(amount)) {
                result[storageName] = amount;
            }
        }
        return {
            amounts: result,
            uom: uom
        };


    }
}