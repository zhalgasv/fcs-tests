import{ Page, expect } from "@playwright/test";


export class InventoryPage {
    constructor(public page: Page) {}

    async openList() {
        await this.page.goto(`http://localhost:4400/storage-invoices/inventory`);


        await expect(this.page.locator('nz-page-header-title')).toHaveText('Накладные');
    }


    async goToCreateForm(){

        await this.page.locator('[data-pw-add-new-button]').click();

// Verify that the URL has changed to the 'new' page
        await expect(this.page).toHaveURL(/new$/);
    }

    async selectShift(shiftNumber: string){

        const desiredShift = this.page.locator(`[data-pw-shift-select] label:has-text("№ ${shiftNumber}")`);


        await desiredShift.click();
        await expect(desiredShift).toHaveClass(/ant-radio-wrapper-checked/);
    }

    async selectStorage(storage: string){

        const storageInput = this.page.locator('[data-pw-storage-select]');

        await storageInput.click();

        const option = this.page.locator('.ant-select-item-option-content', {hasText: storage});

        await option.click();
    }

    async selectCategories(categoryNames: string[]){
        await this.page.locator('.ant-spin-nested-loading').isHidden();

        for (const categoryName of categoryNames) {
            // Find the specific node by its text content inside the tree component.
            // const categoryNode = this.page.locator('[data-pw-category-tree]').locator(`nz-tree-node-title:has-text("${categoryName}")`);
            const categoryNode = this.page.locator('[data-pw-category-tree]')
                .locator('nz-tree-node-title', { hasText: new RegExp(`^${categoryName}$`) });
            // Navigate up to the parent and find the checkbox.
            const checkbox = categoryNode.locator('..').locator('.ant-tree-checkbox');

            await checkbox.click();

            // Verify that the checkbox is checked.
            await expect(checkbox).toHaveClass(/ant-tree-checkbox-checked/);
        }
    }

    async saveInvoice(){
        const saveButton = this.page.locator('[data-pw-save-button]');
        await saveButton.click();

    }

    }
