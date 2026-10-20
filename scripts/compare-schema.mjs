import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function compare() {
  const schemaDir = path.resolve('src/lib/db/schema');
  const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts'));

  const dbTablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  const dbTableNames = dbTablesRes.rows.map(r => r.table_name);

  console.log("=== CHECKING ALL TABLES AND COLUMNS ===");

  for (const tableName of dbTableNames) {
    const colsRes = await pool.query(
      "SELECT column_name, data_type, is_nullable, udt_name FROM information_schema.columns WHERE table_name = $1",
      [tableName]
    );
    const dbCols = colsRes.rows.map(r => r.column_name);

    // Search for table in schema files
    for (const file of files) {
      const content = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
      const tableMatch = content.match(new RegExp(`pgTable\\(["']${tableName}["']`, 'm'));
      if (tableMatch) {
        console.log(`\nFound table "${tableName}" defined in schema "${file}"`);
        
        // Find all columns defined in this pgTable block
        // Drizzle defines columns like: colName: type("db_col_name", ...)
        // or colName: type("db_col_name")
        const colRegex = /^\s*([a-zA-Z0-9_]+):\s*[a-zA-Z0-9_]+\(["']([a-zA-Z0-9_]+)["']/gm;
        let m;
        const schemaCols = [];
        while ((m = colRegex.exec(content)) !== null) {
          schemaCols.push({ tsName: m[1], dbCol: m[2] });
        }

        // Compare schemaCols vs dbCols
        const missingInDb = schemaCols.filter(c => !dbCols.includes(c.dbCol));
        const extraInDb = dbCols.filter(c => !schemaCols.some(sc => sc.dbCol === c));

        if (missingInDb.length > 0) {
          console.log(`  [!] Columns in schema file "${file}" but MISSING in database:`, missingInDb.map(c => `${c.tsName} -> "${c.dbCol}"`));
        }
        if (extraInDb.length > 0) {
          console.log(`  [i] Columns in database but not in schema "${file}":`, extraInDb);
        }
        if (missingInDb.length === 0) {
          console.log(`  [OK] All schema columns exist in database.`);
        }
      }
    }
  }

  await pool.end();
}

compare().catch(console.error);
