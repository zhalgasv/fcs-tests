import {Page , expect } from "@playwright/test";

export interface ProductAmountsResult {
    amounts: Record<string, number>;
    uom: string;
}

export class ConversionPage {
    constructor(private page: Page) {}

    async openList(){
        await this.page.goto('http://localhost:4400/storage-invoices/conversion');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Накладные');
    }

    async goToCreateForm(){
        await this.page.click('span:has-text("Добавить")');
        await expect(this.page).toHaveURL('http://localhost:4400/storage-invoices/conversion/new');
    }

    async selectInvoiceDate(date: string) {
        // 1. Находим контейнер по data-pw, а затем ищем вложенный input.
        // Это самый надежный способ.
        const datePickerInput = this.page.locator('[data-pw-incoming-invoice-date]').locator('input').first();

        // 2. Вводим дату
        await datePickerInput.fill(date);

        // 3. Активируем календарь кликом (для гарантии открытия)
        await datePickerInput.click();

        // 4. Жмём "Сейчас", если кнопка есть
        const nowBtn = this.page.locator('.ant-picker-now-btn');
        // Используем короткий таймаут для проверки видимости
        if (await nowBtn.isVisible({timeout: 1000})) {
            await nowBtn.click();
        }

        // 5. Используем универсальный локатор Playwright для кнопки "ОК"
        // (Это обходит проблемы с оверлеями Ant Design)
        const okButton = this.page.getByRole('button', {name: 'ОК', exact: true});

        // 6. Ждем кнопку и кликаем.
        await okButton.waitFor({state: 'visible', timeout: 5000});
        await okButton.click();

        // 7. Проверяем, что календарь закрылся
        await expect(this.page.locator('.ant-picker-dropdown')).toBeHidden();

        // 8. Убеждаемся, что поле содержит введенную дату
        // await expect(datePickerInput).toHaveValue(date);
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

    async selectFormula(formula: string){
        const FormulaInput = this.page.locator('[data-pw-conversion-rule-select]')

        const formulaInput = FormulaInput.getByRole('textbox');

        await FormulaInput.click();


        await formulaInput.fill(formula);

        const desiredOption = this.page.locator('nz-option-item', { hasText: formula });

        await desiredOption.waitFor({ state: 'visible' });

        await desiredOption.click();

        // 7. Проверка: ожидаем, что поле выбора теперь содержит выбранное значение

    }

    async setOutputProductAmount(amount: number) {
        // Локатор для таблицы КОНЕЧНОГО продукта (Output) - ВЕРХНЯЯ таблица
        // const outputTable = this.page.locator('[data-pw-output-product-table]');
        const outputTable = this.page.getByText('Конечный продукт').locator('xpath=following::table[1]');
        const productRow = outputTable.locator('tbody tr').last();

        await productRow.waitFor({ state: 'visible', timeout: 15000 });

        // Активируем поле ввода (кликаем по отображаемому значению)
        const inlineInput = productRow.locator('bm-inline-input');
        await inlineInput.waitFor({ state: 'attached', timeout: 10000 });
        const displayButton = inlineInput.locator('button[nztype="link"]');

        await displayButton.waitFor({ state: 'visible', timeout: 5000 });
        await displayButton.click();

        // Локализуем и заполняем input[type="number"]
        const amountInput = inlineInput.locator('input[type="number"]');

        await amountInput.waitFor({ state: 'visible', timeout: 5000 });
        await amountInput.fill(amount.toString());
        await amountInput.press('Enter');
    }

    async getInputAmountFromUI(): Promise<number> {
        //  Локатор для таблицы ВХОДЯЩИХ продуктов (Input) - НИЖНЯЯ таблица
        const inputTable = this.page.locator('[data-pw-output-products-table]');
        const productRow = inputTable.locator('tbody tr').last();

        const amountSpan = productRow.locator('span.minus-color');

        await amountSpan.waitFor({ state: 'visible', timeout: 15000 });
        const fullText = await amountSpan.innerText(); // например "2"

        // дальше извлекаем число и возвращаем
        const amountMatch = fullText.match(/(-?\d+\.?\d*)/);
        return amountMatch ? Math.abs(parseFloat(amountMatch[1])) : 0;

    }


    async goToProductsPage(){
        await this.page.goto('http://localhost:4400/products');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Остатки товаров');
    }
    async save(){
        const saveButton = this.page.getByRole('button', { name: 'Конвертировать' });

        // 2. Ждем, пока кнопка станет доступной/не заблокированной (если она блокируется после ввода)
        await saveButton.waitFor({ state: 'visible', timeout: 10000 });

        // 3. Кликаем по кнопке
        await saveButton.click();
    }


    async filterProductsByName(productName: string) {
        const filterInput = this.page.locator('[data-pw-query-filter-input]');
        await filterInput.fill(productName);

        await expect(this.page.getByRole('link', { name: productName, exact: true })).toBeVisible({ timeout: 10000 });

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
        const productLink = this.page.getByRole('link', { name: productName, exact: true });
        await productLink.click();
        await expect(this.page).toHaveURL(/\/products\/.*\/view$/);
    }

    async waitForInputTableVisible() {
        await this.page.locator('[data-pw-input-products-table]')
            .waitFor({ state: 'visible', timeout: 15000 });
    }

    /**
     * Ожидает, пока таблица конечных продуктов станет видимой.
     */
    async waitForOutputTableVisible() {
        await this.page.locator('[data-pw-output-products-table]') // Убедитесь, что здесь 'products'
            .waitFor({ state: 'visible', timeout: 15000 });
    }
}