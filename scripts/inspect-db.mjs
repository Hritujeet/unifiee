import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('Postgres tables:', tables.rows.map(r => r.table_name));
  
  for (const t of tables.rows) {
    const cols = await pool.query(
      "SELECT column_name, data_type, is_nullable, udt_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
      [t.table_name]
    );
    console.log('\n--- TABLE:', t.table_name);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type}/${c.udt_name}${c.is_nullable === 'NO' ? ' NOT NULL' : ''})`).join('\n'));
  }

  // Also print all enums
  const enums = await pool.query(
    "SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname"
  );
  console.log('\n--- ENUMS IN DB ---');
  for (const e of enums.rows) {
    console.log(`${e.enum_name}: [${e.enum_values.join(', ')}]`);
  }

  await pool.end();
}
check().catch(console.error);
