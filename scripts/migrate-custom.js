import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Applying custom migration...");
    
    // Rename vendor to manufacturer
    await client.query(`ALTER TABLE "vendor" RENAME TO "manufacturer";`);
    
    // Rename constraint if it exists (ignore error if it doesn't match default drizzle name)
    try {
        await client.query(`ALTER TABLE "manufacturer" RENAME CONSTRAINT "vendor_user_id_user_id_fkey" TO "manufacturer_user_id_user_id_fkey";`);
    } catch (e) {
        console.log("Constraint rename skipped or not found.");
    }
    
    // Drop vendor_type column
    await client.query(`ALTER TABLE "manufacturer" DROP COLUMN "vendor_type";`);

    // Create enums for designer
    await client.query(`CREATE TYPE "availability_status" AS ENUM('available', 'limited', 'unavailable');`);
    await client.query(`CREATE TYPE "pricing_model" AS ENUM('per_project', 'hourly', 'per_design');`);

    // Create packaging_designers table
    await client.query(`
      CREATE TABLE "packaging_designers" (
        "id" uuid PRIMARY KEY UNIQUE,
        "user_id" text NOT NULL UNIQUE,
        "full_name" varchar(300) NOT NULL,
        "display_name" varchar(300),
        "email" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(255) NOT NULL UNIQUE,
        "profile_photo_url" text,
        "city" varchar(100),
        "state" varchar(100),
        "country" varchar(100),
        "headline" varchar(500),
        "bio" text,
        "years_of_experience" integer,
        "specializations" json,
        "software_tools" json,
        "languages" json,
        "industries_served" json,
        "portfolio_url" text NOT NULL,
        "additional_links" json,
        "portfolio_images" json,
        "pricing_model" "pricing_model",
        "starting_price" numeric,
        "hourly_rate" numeric,
        "charges_notes" text,
        "turnaround_time" varchar(255),
        "revisions_included" integer,
        "availability_status" "availability_status" DEFAULT 'available'::"availability_status",
        "is_verified" boolean DEFAULT false,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    // Add foreign key
    await client.query(`
      ALTER TABLE "packaging_designers" ADD CONSTRAINT "packaging_designers_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    pool.end();
  }
}

main();
