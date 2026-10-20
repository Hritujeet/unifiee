import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query('SELECT * FROM "drizzle"."__drizzle_migrations" ORDER BY created_at');
    console.log('Applied migrations:', res.rows.map(r => r.hash + ' - ' + new Date(Number(r.created_at)).toISOString()));
  } catch (err) {
    console.error('Migrations check error:', err.message);
  }
  await pool.end();
}

check();
