CREATE TYPE "designer_service_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TABLE "designer_services" (
	"id" uuid PRIMARY KEY,
	"designer_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"service_type" varchar(100) NOT NULL,
	"pricing_model" "pricing_model" NOT NULL,
	"price" numeric(12,2) NOT NULL,
	"turnaround_days" integer NOT NULL,
	"revisions_included" integer DEFAULT 0 NOT NULL,
	"deliverables" json DEFAULT '[]' NOT NULL,
	"sample_images" json DEFAULT '[]' NOT NULL,
	"status" "designer_service_status" DEFAULT 'active'::"designer_service_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "designer_services" ADD CONSTRAINT "designer_services_designer_id_packaging_designers_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "packaging_designers"("id") ON DELETE CASCADE;