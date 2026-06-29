import { neonConfig } from '@neondatabase/serverless';
import { test, expect } from '@playwright/test';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('No db url is set!');
const prisma =
	DATABASE_URL.includes('localhost') ||
	DATABASE_URL.includes('127.0.0.1') ||
	DATABASE_URL.includes('db')
		? new PrismaClient()
		: new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });
let problemId: string;

test.beforeEach(async () => {
	await prisma.user.deleteMany({ where: { NOT: { email: 'fake-email@gmail.com' } } });
	await prisma.problem.deleteMany();
	await prisma.user.upsert({
		where: { email: 'fake-email@gmail.com' },
		create: {
			firstName: 'test',
			lastName: 'user',
			email: 'fake-email@gmail.com',
			passwordHash: '$2b$10$SIVUthFCptFyMzKNhSNyLOCN4l1dBrgJePwH4Cjvo8PXYOJO9c8Ki'
		},
		update: {},
		select: { id: true }
	});
	problemId = (
		await prisma.problem.create({
			data: {
				title: 'E2E test problem',
				description: 'Fake problem for E2E testing',
				category: 'Playwright test',
				difficulty: 'hard',
				referenceSolution: 'Identify this is a fake problem created for E2E testing',
				hints: ['fake-hint-1', 'fake-hint-2', 'fake-hint-3']
			},
			select: { id: true }
		})
	).id;
});
test.afterEach(async () => {
	await prisma.user.deleteMany({ where: { NOT: { email: 'fake-email@gmail.com' } } });
	await prisma.problem.deleteMany();
	await prisma.$disconnect();
});
test('should load the problem attempt page and display details', async ({ page }) => {
	test.setTimeout(90000);
	await page.goto(`/problems/${problemId}`);
	await page.waitForLoadState('networkidle');
	await expect(page.getByRole('heading', { name: 'E2E test problem' })).toBeVisible();
	await expect(page.getByText('Fake problem for E2E testing')).toBeVisible();
	const steps: Record<string, string> = {
		understanding: 'fake-understandingfake-understandingfake-understandingfake-understanding',
		breakdown: 'fake-breakdownfake-breakdownfake-breakdownfake-breakdown',
		approach: 'fake-approachfake-approachfake-approachfake-approach',
		solution: 'fake-solutionfake-solutionfake-solutionfake-solution'
	};
	for (const [step, value] of Object.entries(steps)) {
		await expect(page.getByRole('heading', { name: `Step: ${step}` })).toBeVisible({
			timeout: 15000
		});
		await page.locator('[name="content"]').fill(value);
		await page.getByRole('button', { name: 'Save & Next' }).click();
	}
	await expect(page.getByRole('heading', { name: 'Step: reflection' })).toBeVisible({
		timeout: 15000
	});
	await page
		.locator('[name="content"]')
		.fill('fake-reflectionfake-reflectionfake-reflectionfake-reflection');
	await page.getByRole('button', { name: 'Submit Solution' }).click();
	await expect(page).toHaveURL(`/problems/${problemId}/results`);
	await expect(page.getByText('Overall Rating')).toBeVisible({ timeout: 60000 });
});
