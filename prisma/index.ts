import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in environment variables');
}

export const prisma =
	DATABASE_URL.includes('localhost') ||
	DATABASE_URL.includes('127.0.0.1') ||
	DATABASE_URL.includes('db')
		? new PrismaClient()
		: new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });
