import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('C:/Users/A.Purushotham/OneDrive/Desktop/ThinkStack-svelte/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!dbUrlMatch) {
	console.error('DATABASE_URL not found in .env');
	process.exit(1);
}
const databaseUrl = dbUrlMatch[1];

const jsonPath = path.resolve(
	'C:/Users/A.Purushotham/OneDrive/Desktop/ThinkStack-svelte/src/lib/server/data/problems.json'
);
const problems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`Found ${problems.length} problems in JSON file.`);

const sql = neon(databaseUrl);

console.log('Clearing existing problems...');
await sql`DELETE FROM problems`;

console.log('Seeding database...');
let count = 0;
for (const p of problems) {
	const difficulty = p.difficulty.toLowerCase();
	await sql`
    INSERT INTO problems (title, description, difficulty, category, reference_solution, hints, is_active)
    VALUES (${p.title}, ${p.description}, ${difficulty}, ${p.category}, ${p.referenceSolution || ''}, ${p.hints || []}, ${p.isActive !== false})
  `;
	count++;
}

console.log(`Successfully seeded ${count} problems!`);
