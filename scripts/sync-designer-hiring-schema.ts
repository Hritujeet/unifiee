import { config } from "dotenv"
config({ path: ".env.local" })

import { Pool } from "pg"
import { normalizeDatabaseConnectionString } from "../src/lib/db/connection-string"

async function runMigration() {
    console.log("Connecting to database...")
    const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
    if (!url) throw new Error("No database URL provided")
    const pool = new Pool({ connectionString: normalizeDatabaseConnectionString(url) })
    const client = await pool.connect()

    try {
        console.log("Starting designer hiring schema migration...")
        await client.query("BEGIN;")

        // 1. Enums
        console.log("Ensuring enums...")
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE "gig_category" AS ENUM(
                    'dieline_structural',
                    'label_sticker',
                    'logo_brand_identity',
                    '3d_mockup_render',
                    'full_packaging_set'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE "package_tier" AS ENUM('basic', 'standard', 'premium');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `)

        // Update designer_service_status enum values
        await client.query(`
            DO $$ BEGIN
                ALTER TYPE "designer_service_status" ADD VALUE IF NOT EXISTS 'draft';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "designer_service_status" ADD VALUE IF NOT EXISTS 'published';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `)

        // Update hired_service_status enum values
        await client.query(`
            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'requested';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'delivered';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'revision_requested';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'declined';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'cancelled';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'expired';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                ALTER TYPE "hired_service_status" ADD VALUE IF NOT EXISTS 'closed';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `)

        // Commit enum additions since Postgres requires ALTER TYPE ... ADD VALUE to be committed before values can be used in some contexts
        await client.query("COMMIT;")
        await client.query("BEGIN;")

        // 2. Extend designer_services table
        console.log("Extending designer_services...")
        await client.query(`
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "slug" varchar(200);
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "category" "gig_category";
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "tags" json DEFAULT '[]'::json NOT NULL;
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "packaging_types" json DEFAULT '[]'::json NOT NULL;
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "software_used" json DEFAULT '[]'::json NOT NULL;
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "faq" json DEFAULT '[]'::json NOT NULL;
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "rating_avg" numeric(3, 2) DEFAULT '0' NOT NULL;
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0 NOT NULL;
            ALTER TABLE "designer_services" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

            CREATE UNIQUE INDEX IF NOT EXISTS "designer_services_slug_unique" ON "designer_services" ("slug");
            CREATE INDEX IF NOT EXISTS "designer_services_category_idx" ON "designer_services" ("category");
        `)

        // Populate slugs and categories for existing gigs
        console.log("Migrating existing designer_services status & slugs...")
        await client.query(`
            UPDATE "designer_services" 
            SET "status" = 'published'::designer_service_status 
            WHERE "status"::text = 'active';

            UPDATE "designer_services"
            SET "slug" = lower(regexp_replace(title || '-' || substr(id::text, 1, 8), '[^a-zA-Z0-9]+', '-', 'g'))
            WHERE "slug" IS NULL;

            UPDATE "designer_services"
            SET "category" = CASE 
                WHEN "service_type" = 'label_design' THEN 'label_sticker'::gig_category
                WHEN "service_type" = '3d_rendering' THEN '3d_mockup_render'::gig_category
                WHEN "service_type" = 'brand_identity' THEN 'logo_brand_identity'::gig_category
                WHEN "service_type" = 'print_ready_artwork' THEN 'full_packaging_set'::gig_category
                ELSE 'dieline_structural'::gig_category
            END
            WHERE "category" IS NULL;
        `)

        // 3. designer_service_packages
        console.log("Creating designer_service_packages...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "designer_service_packages" (
                "id" uuid PRIMARY KEY NOT NULL,
                "service_id" uuid NOT NULL REFERENCES "designer_services"("id") ON DELETE CASCADE,
                "tier" "package_tier" NOT NULL,
                "name" varchar(100) NOT NULL,
                "description" text NOT NULL,
                "price" numeric(12, 2) NOT NULL,
                "delivery_days" integer NOT NULL,
                "revisions_included" integer DEFAULT 2 NOT NULL,
                "deliverables" json DEFAULT '[]'::json NOT NULL,
                "source_files_included" boolean DEFAULT false NOT NULL,
                "commercial_use_included" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "designer_service_packages_service_idx" ON "designer_service_packages" ("service_id");
            CREATE UNIQUE INDEX IF NOT EXISTS "designer_service_packages_service_tier_unique" ON "designer_service_packages" ("service_id", "tier");
        `)

        // Migrate existing designer_services rows into basic packages if not already present
        console.log("Seeding basic packages for existing gigs...")
        await client.query(`
            INSERT INTO "designer_service_packages" (
                "id", "service_id", "tier", "name", "description", "price", "delivery_days", 
                "revisions_included", "deliverables", "source_files_included", "commercial_use_included"
            )
            SELECT 
                gen_random_uuid(),
                s.id,
                'basic'::package_tier,
                'Basic Package',
                s.description,
                s.price,
                s.turnaround_days,
                s.revisions_included,
                s.deliverables,
                false,
                true
            FROM "designer_services" s
            LEFT JOIN "designer_service_packages" p ON p.service_id = s.id AND p.tier = 'basic'
            WHERE p.id IS NULL;
        `)

        // 4. designer_service_extras
        console.log("Creating designer_service_extras...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "designer_service_extras" (
                "id" uuid PRIMARY KEY NOT NULL,
                "service_id" uuid NOT NULL REFERENCES "designer_services"("id") ON DELETE CASCADE,
                "name" varchar(100) NOT NULL,
                "price" numeric(12, 2) NOT NULL,
                "extra_days" integer DEFAULT 0 NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "designer_service_extras_service_idx" ON "designer_service_extras" ("service_id");
        `)

        // 5. business_saved_services
        console.log("Creating business_saved_services...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "business_saved_services" (
                "id" uuid PRIMARY KEY NOT NULL,
                "business_id" uuid NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
                "service_id" uuid NOT NULL REFERENCES "designer_services"("id") ON DELETE CASCADE,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "business_saved_services_business_idx" ON "business_saved_services" ("business_id");
            CREATE INDEX IF NOT EXISTS "business_saved_services_service_idx" ON "business_saved_services" ("service_id");
        `)

        // 6. Extend business_hired_services
        console.log("Extending business_hired_services...")
        // Drop old check constraint and unique index if existing
        await client.query(`
            ALTER TABLE "business_hired_services" DROP CONSTRAINT IF EXISTS "business_hired_services_completion_check";
            DROP INDEX IF EXISTS "business_hired_services_business_service_active_unique";

            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "package_tier" varchar(20);
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "package_name" varchar(100);
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "delivery_days" integer DEFAULT 7 NOT NULL;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "revisions_included" integer DEFAULT 2 NOT NULL;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "revisions_used" integer DEFAULT 0 NOT NULL;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "extras" json DEFAULT '[]'::json;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "brief" json;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "due_at" timestamp;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "linked_order_id" uuid REFERENCES "business_orders"("id") ON DELETE SET NULL;
            ALTER TABLE "business_hired_services" ADD COLUMN IF NOT EXISTS "cancel_reason" text;

            CREATE INDEX IF NOT EXISTS "business_hired_services_due_at_idx" ON "business_hired_services" ("due_at");
        `)

        // 7. hired_service_events
        console.log("Creating hired_service_events...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "hired_service_events" (
                "id" uuid PRIMARY KEY NOT NULL,
                "order_id" uuid NOT NULL REFERENCES "business_hired_services"("id") ON DELETE CASCADE,
                "status" varchar(40) NOT NULL,
                "actor_user_id" text,
                "actor_role" varchar(20),
                "note" text,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "hired_service_events_order_idx" ON "hired_service_events" ("order_id");
            CREATE INDEX IF NOT EXISTS "hired_service_events_created_idx" ON "hired_service_events" ("created_at");
        `)

        // 8. hired_service_messages
        console.log("Creating hired_service_messages...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "hired_service_messages" (
                "id" uuid PRIMARY KEY NOT NULL,
                "order_id" uuid NOT NULL REFERENCES "business_hired_services"("id") ON DELETE CASCADE,
                "sender_id" text REFERENCES "user"("id") ON DELETE SET NULL,
                "body" text NOT NULL,
                "attachments" json DEFAULT '[]'::json NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "read_at" timestamp
            );

            CREATE INDEX IF NOT EXISTS "hired_service_messages_order_idx" ON "hired_service_messages" ("order_id");
            CREATE INDEX IF NOT EXISTS "hired_service_messages_sender_idx" ON "hired_service_messages" ("sender_id");
            CREATE INDEX IF NOT EXISTS "hired_service_messages_created_idx" ON "hired_service_messages" ("created_at");
        `)

        // 9. hired_service_deliveries
        console.log("Creating hired_service_deliveries...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "hired_service_deliveries" (
                "id" uuid PRIMARY KEY NOT NULL,
                "order_id" uuid NOT NULL REFERENCES "business_hired_services"("id") ON DELETE CASCADE,
                "version_number" integer DEFAULT 1 NOT NULL,
                "files" json DEFAULT '[]'::json NOT NULL,
                "preview_url" text,
                "designer_note" text,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "hired_service_deliveries_order_idx" ON "hired_service_deliveries" ("order_id");
        `)

        // 10. designer_reviews
        console.log("Creating designer_reviews...")
        await client.query(`
            CREATE TABLE IF NOT EXISTS "designer_reviews" (
                "id" uuid PRIMARY KEY NOT NULL,
                "order_id" uuid NOT NULL UNIQUE,
                "service_id" uuid REFERENCES "designer_services"("id") ON DELETE SET NULL,
                "designer_id" uuid REFERENCES "packaging_designers"("id") ON DELETE SET NULL,
                "business_id" uuid REFERENCES "business"("id") ON DELETE SET NULL,
                "rating" integer NOT NULL,
                "communication_rating" integer NOT NULL,
                "quality_rating" integer NOT NULL,
                "as_described_rating" integer NOT NULL,
                "text" text,
                "designer_reply" text,
                "designer_replied_at" timestamp,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "designer_reviews_service_idx" ON "designer_reviews" ("service_id");
            CREATE INDEX IF NOT EXISTS "designer_reviews_designer_idx" ON "designer_reviews" ("designer_id");
            CREATE INDEX IF NOT EXISTS "designer_reviews_business_idx" ON "designer_reviews" ("business_id");
        `)

        await client.query("COMMIT;")
        console.log("Designer hiring schema migration completed successfully!")
    } catch (error) {
        await client.query("ROLLBACK;")
        console.error("Migration failed:", error)
        throw error
    } finally {
        client.release()
        await pool.end()
    }
}

runMigration().catch((e) => {
    console.error(e)
    process.exit(1)
})

