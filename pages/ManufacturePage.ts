import {Page, expect} from "@playwright/test";

export interface ManufactureComponent {
    name: string;
    amount: number;
    uom: string;
}

export class ManufacturePage {
    constructor(public page: Page) {
    }

    async openList() {
        await this.page.goto('/storage-invoices/manufacture');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Производство');
    }

    async goToCreateForm() {
        await this.page.click('span:has-text("Добавить")');
        await expect(this.page).toHaveURL('/storage-invoices/manufacture/new');
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
        const storageFieldContainer = this.page.locator(`[data-pw-${dataPwSelector}]`);
        const storageInput = storageFieldContainer.locator('input');

        await storageInput.click();

        // ⏳ ждем пока появится вариант с нужным названием
        const desiredItem = this.page.locator('.ant-select-item-option-content', { hasText: storageName });
        await desiredItem.waitFor({ state: 'visible', timeout: 10000 });

        await desiredItem.click();

        // Проверяем, что выбран правильный склад
        // await expect(storageInput).toHaveValue(storageName);
    }


    async selectProduct(productName: string) {
        // 1️⃣ Открываем поле выбора продукта
        const input = this.page.locator('bm-store-product-select input.ant-select-selection-search-input');
        await input.click();
        await input.fill(productName);

        // 2️⃣ Ждем и выбираем нужный вариант
        const option = this.page.locator('nz-option-item', { hasText: productName }).first();
        await expect(option).toBeVisible({ timeout: 5000 });
        await option.click();

        // 3️⃣ Ждем, пока подтянутся данные по ингредиентам
        const mainProduct = this.page.locator('[data-pw-product-title]', { hasText: productName });
        await expect(mainProduct).toBeVisible({ timeout: 10000 });

        console.log(`✅ Выбран продукт: ${productName}`);
    }

    async getComponentsFromUI(): Promise<ManufactureComponent[]> {
        const rows = this.page.locator('[data-pw-product-title]');
        const count = await rows.count();
        const components: ManufactureComponent[] = [];

        for (let i = 0; i < count; i++) {
            const name = (await rows.nth(i).innerText()).trim();
            const amountText = (await this.page.locator('[data-pw-product-amount]').nth(i).innerText()).trim();
            const uom = (await this.page.locator('.uom-title').nth(i).innerText()).trim();

            const amount = parseFloat(amountText.replace(',', '.'));

            components.push({ name, amount, uom });
        }

        console.log("📦 Компоненты из UI:", components);
        return components;
    }

    async save() {
        await this.page.getByText("Сохранить").click();
        await expect(this.page).toHaveURL(/\/storage-invoices\/manufacture$/);
    }

    async goToProductsPage(){
        await this.page.goto('/products');
        await expect(this.page.locator('nz-page-header-title')).toHaveText('Остатки товаров');
    }


    async getProductAmountsByStorages(productName: string) {
        await this.goToProductsPage();
        const filterInput = this.page.locator('[data-pw-query-filter-input]');
        await filterInput.fill(productName);

        const productLink = this.page.getByRole('link', { name: productName, exact: true });
        await expect(productLink).toBeVisible({ timeout: 10000 });
        await productLink.click();

        const uomText = await this.page.locator('[data-pw-storage] [data-pw-storage-uom]').first().innerText();
        const uom = uomText.trim();

        const storages = this.page.locator('[data-pw-storage]');
        const result: Record<string, number> = {};
        const count = await storages.count();

        for (let i = 0; i < count; i++) {
            const storage = storages.nth(i);
            const name = (await storage.locator('[data-pw-storage-title]').innerText()).replace(':', '').trim();
            const amountText = await storage.locator('[data-pw-storage-amount]').innerText();
            const amount = parseInt(amountText.trim(), 10);
            if (!isNaN(amount)) {
                result[name] = amount;
            }
        }

        return { amounts: result, uom };
    }
}