ALTER TYPE "hired_service_status" ADD VALUE 'in_review' BEFORE 'completed';--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "cancellation_role" varchar(32);--> statement-breakpoint
ALTER TABLE "business_orders" ADD COLUMN "cancellation_reason" text;