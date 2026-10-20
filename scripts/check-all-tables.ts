import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import all schema files
import * as authSchema from '../src/lib/db/schema/auth-schema';
import * as businessHiredService from '../src/lib/db/schema/business-hired-service';
import * as businessOrder from '../src/lib/db/schema/business-order';
import * as businessRequirement from '../src/lib/db/schema/business-requirement';
import * as business from '../src/lib/db/schema/business';
import * as designerService from '../src/lib/db/schema/designer-service';
import * as manufacturer from '../src/lib/db/schema/manufacturer';
import * as offering from '../src/lib/db/schema/offering';
import * as packagingDesigner from '../src/lib/db/schema/packaging-designer';
import * as vendorFacility from '../src/lib/db/schema/vendor-facility';
import * as vendorFulfillment from '../src/lib/db/schema/vendor-fulfillment';
import * as vendorInquiry from '../src/lib/db/schema/vendor-inquiry';
import * as vendorQuotation from '../src/lib/db/schema/vendor-quotation';
import * as vendorReview from '../src/lib/db/schema/vendor-review';

import { isTable, getTableName, getTableColumns } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schemaModules: Record<string, any> = {
  'auth-schema.ts': authSchema,
  'business-hired-service.ts': businessHiredService,
  'business-order.ts': businessOrder,
  'business-requirement.ts': businessRequirement,
  'business.ts': business,
  'designer-service.ts': designerService,
  'manufacturer.ts': manufacturer,
  'offering.ts': offering,
  'packaging-designer.ts': packagingDesigner,
  'vendor-facility.ts': vendorFacility,
  'vendor-fulfillment.ts': vendorFulfillment,
  'vendor-inquiry.ts': vendorInquiry,
  'vendor-quotation.ts': vendorQuotation,
  'vendor-review.ts': vendorReview,
};

async function checkAll() {
  const dbTablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  const dbTableNames = new Set(dbTablesRes.rows.map((r: any) => r.table_name));

  const drizzleTables = new Map<string, { file: string; exportName: string; cols: string[]; tableObj: any }>();

  for (const [file, mod] of Object.entries(schemaModules)) {
    for (const [exportName, val] of Object.entries(mod)) {
      if (isTable(val)) {
        const dbName = getTableName(val);
        const cols = Object.keys(getTableColumns(val));
        drizzleTables.set(dbName, { file, exportName, cols, tableObj: val });
      }
    }
  }

  console.log('=== DRIZZLE TABLES DEFINED (' + drizzleTables.size + ' tables) ===');
  for (const [dbName, info] of drizzleTables.entries()) {
    const exists = dbTableNames.has(dbName);
    console.log(`- DB Table: "${dbName}" [${exists ? 'EXISTS IN DB' : 'MISSING IN DB!'}] -> Export "${info.exportName}" in ${info.file} (${info.cols.length} cols)`);
  }

  console.log('\n=== DB TABLES NOT DEFINED IN DRIZZLE ===');
  for (const dbName of dbTableNames) {
    if (!drizzleTables.has(dbName as string)) {
      console.log(`- ${dbName} exists in DB but not defined in any schema file!`);
    }
  }

  console.log('\n=== COLUMN-LEVEL CHECK FOR EACH TABLE ===');
  for (const [dbName, info] of drizzleTables.entries()) {
    if (!dbTableNames.has(dbName)) continue;
    const dbColsRes = await pool.query(
      "SELECT column_name, data_type, udt_name, is_nullable FROM information_schema.columns WHERE table_name = $1",
      [dbName]
    );
    const dbCols = new Set(dbColsRes.rows.map((r: any) => r.column_name));
    
    // Columns defined in Drizzle
    const tableColumns = getTableColumns(info.tableObj);
    const drizzleCols = Object.entries(tableColumns).map(([tsKey, colObj]: [string, any]) => ({
      tsKey,
      dbCol: colObj.name,
      dataType: colObj.dataType,
    }));

    const missingInDb = drizzleCols.filter(c => !dbCols.has(c.dbCol));
    const missingInDrizzle = Array.from(dbCols).filter(dbc => !drizzleCols.some(dc => dc.dbCol === dbc));

    if (missingInDb.length > 0) {
      console.log(`\n❌ Table "${dbName}" (${info.file}) has columns in Drizzle that DO NOT EXIST IN POSTGRESQL:`);
      for (const m of missingInDb) {
        console.log(`   - ${m.tsKey} (maps to "${m.dbCol}")`);
      }
    }
    if (missingInDrizzle.length > 0) {
      console.log(`\n⚠️ Table "${dbName}" (${info.file}) has columns in PostgreSQL not mapped in Drizzle:`);
      for (const m of missingInDrizzle) {
        console.log(`   - "${m}"`);
      }
    }
    if (missingInDb.length === 0 && missingInDrizzle.length === 0) {
      console.log(`✅ Table "${dbName}" matches PostgreSQL columns perfectly (${drizzleCols.length} cols)`);
    }
  }

  await pool.end();
}

checkAll().catch(console.error);
