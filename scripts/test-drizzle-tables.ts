import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { offeringsTable } from '../src/lib/db/schema/offering';
import { businessOrdersTable } from '../src/lib/db/schema/business-order';
import { businessRequirementsTable } from '../src/lib/db/schema/business-requirement';
import { business } from '../src/lib/db/schema/business';
import { manufacturerTable } from '../src/lib/db/schema/manufacturer';
import { vendorQuotationsTable } from '../src/lib/db/schema/vendor-quotation';
import { vendorFacilitiesTable } from '../src/lib/db/schema/vendor-facility';
import { orderFulfillmentMilestonesTable, orderShipmentsTable } from '../src/lib/db/schema/vendor-fulfillment';
import { user, session } from '../src/lib/db/schema/auth-schema';

async function testTable(name: string, query: Promise<unknown>) {
  try {
    await query;
    console.log(`[PASS] ${name}`);
  } catch (err: any) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function main() {
  console.log('Testing Drizzle queries on all schema tables:');
  await testTable('user', db.select().from(user).limit(1));
  await testTable('session', db.select().from(session).limit(1));
  await testTable('manufacturer', db.select().from(manufacturerTable).limit(1));
  await testTable('business', db.select().from(business).limit(1));
  await testTable('business_requirements', db.select().from(businessRequirementsTable).limit(1));
  await testTable('offerings', db.select().from(offeringsTable).limit(1));
  await testTable('business_orders', db.select().from(businessOrdersTable).limit(1));
  await testTable('vendor_quotations', db.select().from(vendorQuotationsTable).limit(1));
  await testTable('vendor_facilities', db.select().from(vendorFacilitiesTable).limit(1));
  await testTable('order_fulfillment_milestones', db.select().from(orderFulfillmentMilestonesTable).limit(1));
  await testTable('order_shipments', db.select().from(orderShipmentsTable).limit(1));
  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
