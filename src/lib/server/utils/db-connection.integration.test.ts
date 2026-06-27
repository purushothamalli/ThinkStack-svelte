import { describe, test, expect, afterAll, beforeEach } from 'vitest';
import { DATABASE_URL } from '$env/static/private';
import cleanDatabase from './db-clean';
import { prisma } from '../../../../prisma';

describe('Database environment', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});
	afterAll(async () => {
		await prisma.$disconnect();
	});
	test('should load the test database URL from the test environment file', () => {
		console.log(DATABASE_URL);
		expect(DATABASE_URL).toBeDefined();
		expect(DATABASE_URL).toMatch(/ep-purple-cloud/);
	});
});
