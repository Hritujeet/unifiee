CREATE TYPE "order_actor_role" AS ENUM('business', 'manufacturer', 'designer', 'system');--> statement-breakpoint
CREATE TYPE "order_issue_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "order_proof_status" AS ENUM('pending', 'approved', 'changes_requested');--> statement-breakpoint
CREATE TABLE "order_artwork_proofs" (
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
--> statement-breakpoint
CREATE TABLE "order_issues" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"raised_by" text NOT NULL,
	"description" text NOT NULL,
	"vendor_response" text,
	"status" "order_issue_status" DEFAULT 'open'::"order_issue_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
DROP INDEX "order_milestones_order_stage_unique";--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "placed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "dispatched_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "placed_by" text;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "expected_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "vendor_notes" text;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD COLUMN "actor_user_id" text;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD COLUMN "actor_role" "order_actor_role" DEFAULT 'system'::"order_actor_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "eta" timestamp;--> statement-breakpoint
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
END;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "business_order_items" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "business_order_items" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "business_order_item_status";--> statement-breakpoint
CREATE TYPE "business_order_item_status" AS ENUM('placed', 'confirmed', 'proof_pending', 'proof_approved', 'in_production', 'quality_check', 'dispatched', 'delivered', 'completed', 'cancelled', 'rejected');--> statement-breakpoint
ALTER TABLE "business_order_items" ALTER COLUMN "status" SET DATA TYPE "business_order_item_status" USING "status"::"business_order_item_status";--> statement-breakpoint
ALTER TABLE "business_order_items" ALTER COLUMN "status" SET DEFAULT 'placed'::"business_order_item_status";--> statement-breakpoint
ALTER TABLE "business_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "business_orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "business_orders" SET "status" = CASE "status"
	WHEN 'draft' THEN 'placed'
	WHEN 'submitted' THEN 'placed'
	WHEN 'processing' THEN 'in_production'
	WHEN 'shipped' THEN 'dispatched'
	ELSE "status"
END;--> statement-breakpoint
UPDATE "business_order_items" SET "status" = CASE "status"
	WHEN 'pending' THEN 'placed'
	WHEN 'processing' THEN 'in_production'
	WHEN 'shipped' THEN 'dispatched'
	ELSE "status"
END;--> statement-breakpoint
DROP TYPE "business_order_status";--> statement-breakpoint
CREATE TYPE "business_order_status" AS ENUM('placed', 'confirmed', 'proof_pending', 'proof_approved', 'in_production', 'quality_check', 'dispatched', 'delivered', 'completed', 'cancelled', 'rejected');--> statement-breakpoint
ALTER TABLE "business_orders" ALTER COLUMN "status" SET DATA TYPE "business_order_status" USING "status"::"business_order_status";--> statement-breakpoint
ALTER TABLE "business_orders" ALTER COLUMN "status" SET DEFAULT 'placed'::"business_order_status";--> statement-breakpoint
CREATE INDEX "business_orders_business_status_idx" ON "business_orders" ("business_id","status");--> statement-breakpoint
CREATE INDEX "order_artwork_proofs_order_idx" ON "order_artwork_proofs" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_artwork_proofs_order_version_unique" ON "order_artwork_proofs" ("order_id","version");--> statement-breakpoint
CREATE INDEX "order_issues_order_idx" ON "order_issues" ("order_id");--> statement-breakpoint
CREATE INDEX "order_issues_raised_by_idx" ON "order_issues" ("raised_by");--> statement-breakpoint
ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_placed_by_user_id_fkey" FOREIGN KEY ("placed_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_artwork_proofs" ADD CONSTRAINT "order_artwork_proofs_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_artwork_proofs" ADD CONSTRAINT "order_artwork_proofs_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order_artwork_proofs" ADD CONSTRAINT "order_artwork_proofs_decided_by_user_id_fkey" FOREIGN KEY ("decided_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_raised_by_user_id_fkey" FOREIGN KEY ("raised_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD CONSTRAINT "order_fulfillment_milestones_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;