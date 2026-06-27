import { afterAll, beforeEach, describe } from 'vitest';
import cleanDatabase from '../utils/db-clean';
import { prisma } from '../../../../prisma';

describe('submissionRepo', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});
	afterAll(async () => {
		await prisma.$disconnect();
	});
});
