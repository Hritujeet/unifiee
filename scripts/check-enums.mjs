import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const enums = await pool.query(
    "SELECT t.typname as enum_name, e.enumlabel as value FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder"
  );
  const map = {};
  for (const r of enums.rows) {
    if (!map[r.enum_name]) map[r.enum_name] = [];
    map[r.enum_name].push(r.value);
  }
  for (const [k, v] of Object.entries(map)) {
    console.log(`${k}: [${v.join(', ')}]`);
  }
  await pool.end();
}

check();
