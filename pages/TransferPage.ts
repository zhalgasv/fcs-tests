import { Page, expect } from "@playwright/test";


export interface ProductAmountsResult {
    amounts: Record<string, number>;
    uom: string;
}

export class TransferPage {
    constructor(public page: Page) {
    }

    async openList(){
        await this.page.goto('http://localhost:4400/storage-invoices/transfer');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Накладные');
    }

    async goToCreateForm(){
        await this.page.click('span:has-text("Добавить")');
        await expect(this.page).toHaveURL('http://localhost:4400/storage-invoices/transfer/new');
    }



    async selectInvoiceDate() {

        await this.page.locator('[data-pw-incoming-invoice-date] input').click();

        // 2. Жмём "Сейчас"
        await this.page.locator('.ant-picker-now-btn').click()


        await this.page.getByRole('button', { name: 'ОК', exact: true }).click();


        await expect(this.page.locator('.ant-picker-panel:visible')).toHaveCount(0);
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

    async save(){
        await this.page.click('button:has-text("Сохранить")');
        await expect(this.page).toHaveURL(/\/storage-invoices\/transfer$/);
    }

    async selectStorage(storageName: string, dataPwSelector: string) {
        // 1. Locate the component using the specific data-pw attribute.
        const storageFieldContainer = this.page.locator(`[data-pw-${dataPwSelector}]`);

        // 2. Find the input field within that component.
        const storageInput = storageFieldContainer.locator('input');

        // 3. Click the input field to open the dropdown list.
        await storageInput.click();

        const dropdown = this.page.locator('.cdk-overlay-container .ant-select-dropdown',).last();
        await expect(dropdown).toBeVisible();
        // 4. Find the item in the dropdown by its text and click it.
        const desiredItem = this.page.locator('.ant-select-item-option-content', { hasText: storageName }).first();
        await desiredItem.click();

        // 5. Verify the field's value.
        await expect(storageFieldContainer).toHaveText(storageName);
    }

    async goToProductsPage(){
        await this.page.goto('http://localhost:4400/products');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Остатки товаров');
    }
    async filterProductsByName(productName: string) {
        const filterInput = this.page.locator('[data-pw-query-filter-input]');
        await filterInput.fill(productName);
        // Добавьте проверку, что таблица отфильтровалась, например,
        // await expect(this.page.locator('tr').filter({ hasText: productName })).toBeVisible();
        await this.page.waitForSelector(`text=${productName}`, { timeout: 10000 });
    }

    async getProductAmountsByStorages(productName: string): Promise<ProductAmountsResult> {


        await this.filterProductsByName(productName);
        await this.viewProductDetails(productName);

        const uomElement = this.page.locator('[data-pw-storage] [data-pw-storage-uom]').first();
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