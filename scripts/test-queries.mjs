import { db } from "../src/lib/db/index.js";
import { offeringsTable } from "../src/lib/db/schema/offering.js";
import { businessOrdersTable } from "../src/lib/db/schema/business-order.js";
import { vendorQuotationsTable } from "../src/lib/db/schema/vendor-quotation.js";
import { manufacturerTable } from "../src/lib/db/schema/manufacturer.js";
import { isNull, eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function test() {
  try {
    console.log("Testing offeringsTable select...");
    await db.select().from(offeringsTable).limit(1);
    console.log("offeringsTable select SUCCESS");
  } catch (e) {
    console.error("offeringsTable select FAILED:", e.message);
  }

  try {
    console.log("Testing businessOrdersTable select...");
    await db.select().from(businessOrdersTable).limit(1);
    console.log("businessOrdersTable select SUCCESS");
  } catch (e) {
    console.error("businessOrdersTable select FAILED:", e.message);
  }

  try {
    console.log("Testing vendorQuotationsTable select...");
    await db.select().from(vendorQuotationsTable).limit(1);
    console.log("vendorQuotationsTable select SUCCESS");
  } catch (e) {
    console.error("vendorQuotationsTable select FAILED:", e.message);
  }

  try {
    console.log("Testing manufacturerTable select...");
    await db.select().from(manufacturerTable).limit(1);
    console.log("manufacturerTable select SUCCESS");
  } catch (e) {
    console.error("manufacturerTable select FAILED:", e.message);
  }
}

test().then(() => process.exit(0));
