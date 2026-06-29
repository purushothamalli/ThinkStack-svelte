import { test as setup, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

setup('authenticate', async ({ page }) => {
	prisma = new PrismaClient();
	setup.setTimeout(60000);
	await prisma.user.upsert({
		where: { email: 'fake-email@gmail.com' },
		create: {
			firstName: 'test',
			lastName: 'user',
			email: 'fake-email@gmail.com',
			passwordHash: '$2b$10$SIVUthFCptFyMzKNhSNyLOCN4l1dBrgJePwH4Cjvo8PXYOJO9c8Ki'
		},
		update: {}
	});
	await page.goto('/login');
	await page.waitForLoadState('networkidle');
	await expect(page).toHaveURL('http://localhost:5173/login');
	await page.getByPlaceholder('Email').fill('fake-email@gmail.com');
	await page.getByPlaceholder('Password').fill('password123');
	await page.getByRole('button', { name: 'Login' }).click();
	await expect(page).toHaveURL('http://localhost:5173/home');
	await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
