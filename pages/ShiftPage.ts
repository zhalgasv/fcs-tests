import { expect, Page } from "@playwright/test";

export class ShiftPage {
    constructor(private page: Page) {}

    async openShiftList(){
        await this.page.goto('http://localhost:4400/shifts');
    }
    async getCurrentShiftStatus(): Promise<string | null > {
      const statusTag = await this.page.locator('nz-tag').first();
      if (!(await statusTag.isVisible())) return null;
      return await statusTag.innerText();
    }

    async openNewShiftIfClosed(){
        const status = await this.getCurrentShiftStatus();
        if (status?.includes('Закрыто') || status?.includes('CLOSED')) {
            console.log('Смена закрыто - открываю новую...');
            await this.page.click('button:has-text("Открыть смену")');
            await expect(this.page.locator('nz-tag')).toContainText('Открыта');
        } else {
            console.log('Смена уже открыта');
        }
    }
}