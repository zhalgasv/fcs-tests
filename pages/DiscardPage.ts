import {Page, Expect, expect} from "@playwright/test";

export interface ProductAmountsResult {
    amounts: Record<string, number>;
    uom: string;
}

export class DiscardPage {
    constructor(private page: Page) {
    }

    async openList(){
        await this.page.goto('http://localhost:4400/storage-invoices/discard');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Накладные');

    }

    async goToCreateForm(){
        await this.page.click('span:has-text("Добавить")');
        await expect(this.page).toHaveURL('http://localhost:4400/storage-invoices/discard/new');
    }

    async selectInvoiceDate(date: string) {

        const datePicker = this.page.locator('[data-pw-incoming-invoice-date]');

        // const dateInput = datePicker.locator('input');
        await datePicker.locator('input').fill(date);


        await this.page.getByText('Сейчас').click();

        // 4. Проверяем, что значение в поле соответствует введенному
        await expect(datePicker.locator('input')).toHaveValue(date);
        // await dateInput.click();
        await this.page.click('body', { position: { x: 0, y: 0 } });

// Проверяем, что календарь исчез
        await expect(this.page.locator('.ant-picker-dropdown')).toBeHidden();
    }



    async selectStorage(storage: string) {
        const StorageInput = this.page.locator('[data-pw-storage-id]');

        await StorageInput.click();

        const option = this.page.locator('.ant-select-item-option-content' , { hasText: storage});

        await option.click();

    }
    async selectReason(reason: string) {
        const ReasonInput = this.page.locator('[data-pw-discarded-reason-category]');

        await ReasonInput.click();

        const option = this.page.locator('.ant-select-item-option-content', {hasText: reason});

        await option.click();
    }

    async save(){
        await this.page.click('button:has-text("Сохранить")');
        await expect(this.page).toHaveURL(/\/storage-invoices\/discard$/);
    }

    async addProduct(name: string, qty: number){

        const productSelect = this.page.locator('[data-pw-product-select] input');
        await productSelect.click();
        await productSelect.fill(name);

        const desiredItem = this.page.locator('nz-option-item', { hasText: name })
        await expect(desiredItem).toBeVisible({ timeout: 5000 });
        await desiredItem.click();

        const lastRow = this.page.locator('[data-pw-product-row]').last();

        await lastRow.locator('[data-pw-product-amount]').fill(qty.toString());



    }
    async goToProductsPage(){
        await this.page.goto('http://localhost:4400/products');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Остатки товаров');
    }

    async filterProductsByName(productName: string) {
        const filterInput = this.page.locator('[data-pw-query-filter-input]');
        await filterInput.fill(productName);

        await expect(this.page.getByRole('link', { name: productName })).toBeVisible({ timeout: 10000 });

    }

    async getProductAmountsByStorages(productName: string): Promise<ProductAmountsResult> {


        await this.filterProductsByName(productName);
        await this.viewProductDetails(productName);

        const uomElement = this.page.locator('[data-pw-storage] [data-pw-storage-uom]').first();

        // Получаем текст (например, "кг", "шт", "л")
        const uomText = await uomElement.innerText();
        const uom = uomText.trim();

        // 3. Сбор остатков по складам
        const storageTags = this.page.locator('[data-pw-storage]');
        const count = await storageTags.count();

        const result: Record<string, number> = {};

        for (let i = 0; i < count; i++) {
            const tag = storageTags.nth(i);

            // Сбор названия склада
            const storageNameWithColon = await tag.locator('[data-pw-storage-title]').innerText();
            const storageName = storageNameWithColon
                .replace(':', '')
                .replace(/\s+/g, ' ')
                .trim();

            // Сбор количества и преобразование в число
            const amountText = await tag.locator('[data-pw-storage-amount]').innerText();
            const amount = parseInt(amountText.trim(), 10);

            if(storageName && !isNaN(amount)) {
                result[storageName] = amount;
            }
        }
        return {
            amounts: result,
            uom: uom
        };
    }


    async viewProductDetails(productName:string){
        const productLink = this.page.getByRole('link', { name: productName });
        await productLink.click();
        await expect(this.page).toHaveURL(/\/products\/.*\/view$/);
    }
}

