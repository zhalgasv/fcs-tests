
import { test, expect } from '@playwright/test';

test('страница Поставщики открывается', async ({ page }) => {
    await page.goto('/main');

    await page.getByRole('link', { name: 'Поставщики' }).click();

    await expect(page).toHaveURL(/\/suppliers/);
    await expect(page.locator('nz-page-header-title')).toHaveText('Поставщики');
});

test('should add a new supplier', async ({ page }) => {
    await page.goto('https://mn.fcs.baimly.dev/suppliers');

    await page.locator('a:has-text("Добавить")').click();

    await expect(page).toHaveURL('https://mn.fcs.baimly.dev/suppliers/new');

    await page.locator('[formcontrolname="countryId"]').click();

    await page.waitForSelector('.ant-select-item-option-content');

    await page.locator('.ant-select-dropdown').locator('text=Қазақстан').click();

    await expect(page.locator('[formcontrolname="countryId"]')).toHaveText('Қазақстан');

    await page.locator('label:has-text("ИИН")').click();
    await expect(page.locator('label:has-text("ИИН") .ant-radio')).toHaveClass(/ant-radio-checked/);

    const uinInput= await page.locator('[formcontrolname="uin"]');
   await uinInput.fill('123456789012');

   await expect(uinInput).toHaveValue(/^\d{12}$/);

  const nameInput = await page.locator('[formcontrolname="name"]');

  await nameInput.fill('Test Supplier');

  await expect(nameInput).toHaveValue('Test Supplier');

    const saveButton = page.getByRole('button', { name: 'Сохранить' });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

});
