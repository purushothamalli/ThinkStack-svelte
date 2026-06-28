import { test, expect } from '@playwright/test';

test('should load the landing page successfully', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/ThinkStack/);
	await expect(page.locator('h1')).toBeVisible();
});
