CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY,
	"scope" varchar(120) NOT NULL,
	"key" varchar(128) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "order_milestones_order_stage_unique" ON "order_fulfillment_milestones" ("order_id","stage");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_records_scope_key_user_unique" ON "idempotency_records" ("scope","key","user_id");--> statement-breakpoint
CREATE INDEX "idempotency_records_expires_idx" ON "idempotency_records" ("expires_at");