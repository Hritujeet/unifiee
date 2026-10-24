import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No database connection string found in .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Connected to database:", connectionString.replace(/:[^:@]+@/, ":****@"));

    // 1. Enable pgvector
    console.log("\n[1/3] Enabling pgvector extension...");
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
    console.log("✓ pgvector extension is enabled.");

    // 2. Create enums if not exist
    console.log("\n[2/3] Creating AI enums...");
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ai_entity_type" AS ENUM('requirement', 'offer', 'gig', 'designer_profile', 'help_doc');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ai_visibility_scope" AS ENUM('public', 'private', 'role_restricted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ AI enums verified/created.");

    // 3. Create ai_documents table and indexes
    console.log("\n[3/3] Creating ai_documents table and indexes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ai_documents" (
        "id" uuid PRIMARY KEY,
        "entity_type" "ai_entity_type" NOT NULL,
        "entity_id" text NOT NULL,
        "owner_id" text,
        "visibility_scope" "ai_visibility_scope" DEFAULT 'public'::"ai_visibility_scope" NOT NULL,
        "chunk_index" integer DEFAULT 0 NOT NULL,
        "content" text NOT NULL,
        "embedding" vector(1024),
        "content_hash" varchar(64) NOT NULL,
        "embedded_at" timestamp,
        "metadata" jsonb DEFAULT '{}' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "ai_documents_embedding_hnsw_idx" 
      ON "ai_documents" USING hnsw ("embedding" vector_cosine_ops);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "ai_documents_entity_type_id_idx" 
      ON "ai_documents" ("entity_type", "entity_id");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "ai_documents_owner_id_idx" 
      ON "ai_documents" ("owner_id");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "ai_documents_visibility_idx" 
      ON "ai_documents" ("visibility_scope");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "ai_documents_content_hash_idx" 
      ON "ai_documents" ("content_hash");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "ai_documents_content_fts_idx" 
      ON "ai_documents" USING gin (to_tsvector('english', "content"));
    `);

    console.log("✓ ai_documents table and all indexes created successfully!");

    // Verify
    const res = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'ai_documents';
    `);
    console.log("\nTable verification: ai_documents columns:");
    console.table(res.rows);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
