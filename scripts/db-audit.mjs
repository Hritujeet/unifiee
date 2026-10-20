import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function audit() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('TABLES IN POSTGRESQL (' + tables.rows.length + ' tables):');
  for (const t of tables.rows) {
    const cols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
      [t.table_name]
    );
    console.log(`- ${t.table_name} (${cols.rows.length} columns)`);
  }
  await pool.end();
}

audit().catch(console.error);
