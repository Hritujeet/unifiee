import { config } from "dotenv"
config({ path: ".env.local" })

import { Pool } from "pg"
import { normalizeDatabaseConnectionString } from "../src/lib/db/connection-string"

async function syncSchema() {
    console.log("Connecting to database...")
    const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
    if (!url) throw new Error("No database URL provided")
    const pool = new Pool({ connectionString: normalizeDatabaseConnectionString(url) })
    const client = await pool.connect()

    try {
        console.log("Starting schema sync transaction...")
        await client.query("BEGIN;")

        // 1. Enums
        console.log("Ensuring enums...")
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE "order_actor_role" AS ENUM('business', 'manufacturer', 'designer', 'system');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE "order_issue_status" AS ENUM('open', 'resolved');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE "order_proof_status" AS ENUM('pending', 'approved', 'changes_requested');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `)

        // 2. business_orders columns
        console.log("Adding business_orders columns...")
        await client.query(`
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "placed_at" timestamp DEFAULT now() NOT NULL;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "dispatched_at" timestamp;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "placed_by" text;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "reject_reason" text;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "cancel_reason" text;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "expected_delivery_date" timestamp;
            ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "vendor_notes" text;
        `)

        await client.query(`
            UPDATE "business_orders" 
            SET "placed_at" = COALESCE("submitted_at", "created_at", now()) 
            WHERE "placed_at" IS NULL;
        `)

        // 3. order_fulfillment_milestones columns
        console.log("Updating order_fulfillment_milestones columns...")
        await client.query(`
            ALTER TABLE "order_fulfillment_milestones" ADD COLUMN IF NOT EXISTS "status" text;
            ALTER TABLE "order_fulfillment_milestones" ADD COLUMN IF NOT EXISTS "actor_user_id" text;
            ALTER TABLE "order_fulfillment_milestones" ADD COLUMN IF NOT EXISTS "actor_role" "order_actor_role" DEFAULT 'system'::"order_actor_role" NOT NULL;
            ALTER TABLE "order_fulfillment_milestones" ADD COLUMN IF NOT EXISTS "note" text;
        `)

        await client.query(`
            UPDATE "order_fulfillment_milestones" SET "status" = CASE "stage"::text
                WHEN 'order_confirmed' THEN 'confirmed'
                WHEN 'artwork_approved' THEN 'proof_approved'
                WHEN 'raw_material_sourced' THEN 'in_production'
                WHEN 'in_production' THEN 'in_production'
                WHEN 'quality_check_passed' THEN 'quality_check'
                WHEN 'packed' THEN 'dispatched'
                WHEN 'dispatched' THEN 'dispatched'
                WHEN 'delivered' THEN 'delivered'
                ELSE 'confirmed'
            END WHERE "status" IS NULL;
        `)

        await client.query(`
            ALTER TABLE "order_fulfillment_milestones" ALTER COLUMN "status" SET NOT NULL;
        `)

        // 4. order_shipments column
        console.log("Updating order_shipments columns...")
        await client.query(`
            ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "eta" timestamp;
        `)

        // 5. Update enums for orders and items
        console.log("Updating status enums...")
        await client.query(`
            ALTER TABLE "business_order_items" ALTER COLUMN "status" SET DATA TYPE text;
            ALTER TABLE "business_order_items" ALTER COLUMN "status" DROP DEFAULT;

            ALTER TABLE "business_orders" ALTER COLUMN "status" SET DATA TYPE text;
            ALTER TABLE "business_orders" ALTER COLUMN "status" DROP DEFAULT;

            UPDATE "business_orders" SET "status" = CASE "status"
                WHEN 'draft' THEN 'placed'
                WHEN 'submitted' THEN 'placed'
                WHEN 'processing' THEN 'in_production'
                WHEN 'shipped' THEN 'dispatched'
                ELSE "status"
            END;

            UPDATE "business_order_items" SET "status" = CASE "status"
                WHEN 'pending' THEN 'placed'
                WHEN 'processing' THEN 'in_production'
                WHEN 'shipped' THEN 'dispatched'
                ELSE "status"
            END;

            DROP TYPE IF EXISTS "business_order_item_status" CASCADE;
            CREATE TYPE "business_order_item_status" AS ENUM('placed', 'confirmed', 'proof_pending', 'proof_approved', 'in_production', 'quality_check', 'dispatched', 'delivered', 'completed', 'cancelled', 'rejected');
            ALTER TABLE "business_order_items" ALTER COLUMN "status" SET DATA TYPE "business_order_item_status" USING "status"::"business_order_item_status";
            ALTER TABLE "business_order_items" ALTER COLUMN "status" SET DEFAULT 'placed'::"business_order_item_status";

            DROP TYPE IF EXISTS "business_order_status" CASCADE;
            CREATE TYPE "business_order_status" AS ENUM('placed', 'confirmed', 'proof_pending', 'proof_approved', 'in_production', 'quality_check', 'dispatched', 'delivered', 'completed', 'cancelled', 'rejected');
            ALTER TABLE "business_orders" ALTER COLUMN "status" SET DATA TYPE "business_order_status" USING "status"::"business_order_status";
            ALTER TABLE "business_orders" ALTER COLUMN "status" SET DEFAULT 'placed'::"business_order_status";
        `)

        // 6. order_artwork_proofs table
        console.log("Ensuring order_artwork_proofs table...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "order_artwork_proofs" (
                "id" uuid PRIMARY KEY,
                "order_id" uuid NOT NULL,
                "version" integer NOT NULL,
                "file_url" text NOT NULL,
                "status" "order_proof_status" DEFAULT 'pending'::"order_proof_status" NOT NULL,
                "feedback" text,
                "uploaded_by" text NOT NULL,
                "decided_by" text,
                "decided_at" timestamp,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `)

        // 7. order_issues table
        console.log("Ensuring order_issues table...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "order_issues" (
                "id" uuid PRIMARY KEY,
                "order_id" uuid NOT NULL,
                "raised_by" text NOT NULL,
                "description" text NOT NULL,
                "vendor_response" text,
                "status" "order_issue_status" DEFAULT 'open'::"order_issue_status" NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "resolved_at" timestamp
            );
        `)

        // 8. Indexes
        console.log("Ensuring indexes...")
        await client.query(`
            CREATE INDEX IF NOT EXISTS "business_orders_business_status_idx" ON "business_orders" ("business_id","status");
            CREATE INDEX IF NOT EXISTS "order_artwork_proofs_order_idx" ON "order_artwork_proofs" ("order_id");
            CREATE UNIQUE INDEX IF NOT EXISTS "order_artwork_proofs_order_version_unique" ON "order_artwork_proofs" ("order_id","version");
            CREATE INDEX IF NOT EXISTS "order_issues_order_idx" ON "order_issues" ("order_id");
            CREATE INDEX IF NOT EXISTS "order_issues_raised_by_idx" ON "order_issues" ("raised_by");
        `)

        // 9. Foreign keys
        console.log("Ensuring foreign keys...")
        await client.query(`
            DO $$ BEGIN
                ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_placed_by_user_id_fkey" FOREIGN KEY ("placed_by") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TABLE "order_artwork_proofs" ADD CONSTRAINT "order_artwork_proofs_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TABLE "order_artwork_proofs" ADD CONSTRAINT "order_artwork_proofs_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TABLE "order_artwork_proofs" ADD CONSTRAINT "order_artwork_proofs_decided_by_user_id_fkey" FOREIGN KEY ("decided_by") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_raised_by_user_id_fkey" FOREIGN KEY ("raised_by") REFERENCES "user"("id") ON DELETE RESTRICT;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TABLE "order_fulfillment_milestones" ADD CONSTRAINT "order_fulfillment_milestones_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `)

        await client.query("COMMIT;")
        console.log("Schema sync completed successfully!")
    } catch (err) {
        console.error("Migration failed, rolling back...", err)
        await client.query("ROLLBACK;")
        throw err
    } finally {
        client.release()
        await pool.end()
    }
}

syncSchema().catch((e) => {
    console.error(e)
    process.exit(1)
})
