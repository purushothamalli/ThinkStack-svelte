import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

console.log('Database_url:-' + DATABASE_URL);
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in environment variables');
}

const adapter = new PrismaNeon({ connectionString: DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
