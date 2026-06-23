import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('Pool options:', pool.options);
  console.log('Pool keys:', Object.keys(pool));
  
  // Try querying
  console.log('Attempting query...');
  const res = await pool.query('SELECT 1');
  console.log('Query result:', res.rows);
  await pool.end();
} catch (err) {
  console.error('Error encountered:', err);
}
