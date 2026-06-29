import { test as setup, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import pg from 'pg';

neonConfig.webSocketConstructor = ws;

let prisma: PrismaClient;

setup('authenticate', async ({ page }) => {
	const DATABASE_URL = process.env.DATABASE_URL;
	if (!DATABASE_URL) throw new Error('No db url is set!');

	const isLocal =
		DATABASE_URL.includes('localhost') ||
		DATABASE_URL.includes('127.0.0.1') ||
		DATABASE_URL.includes('db');

	let adapter;
	if (isLocal) {
		const pool = new pg.Pool({ connectionString: DATABASE_URL });
		adapter = new PrismaPg(pool);
	} else {
		adapter = new PrismaNeon({ connectionString: DATABASE_URL });
	}

	prisma = new PrismaClient({ adapter });

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
