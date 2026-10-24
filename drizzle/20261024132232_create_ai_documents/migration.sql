CREATE TYPE "ai_entity_type" AS ENUM('requirement', 'offer', 'gig', 'designer_profile', 'help_doc');--> statement-breakpoint
CREATE TYPE "ai_visibility_scope" AS ENUM('public', 'private', 'role_restricted');--> statement-breakpoint
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
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_documents_embedding_hnsw_idx" ON "ai_documents" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_documents_entity_type_id_idx" ON "ai_documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_documents_owner_id_idx" ON "ai_documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_documents_visibility_idx" ON "ai_documents" USING btree ("visibility_scope");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_documents_content_hash_idx" ON "ai_documents" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_documents_content_fts_idx" ON "ai_documents" USING gin (to_tsvector('english', "content"));