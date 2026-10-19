CREATE TYPE "business_requirement_status" AS ENUM('requirement_received', 'quoted', 'order_confirmed', 'in_production', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "packaging_type" AS ENUM('cups', 'boxes', 'bags', 'cutlery', 'containers', 'custom');--> statement-breakpoint
CREATE TYPE "packaging_use" AS ENUM('coffee', 'food', 'dessert', 'delivery', 'takeaway', 'other');--> statement-breakpoint
CREATE TYPE "catalog_product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "certification_verification_status" AS ENUM('declared', 'under_review', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "fulfillment_workflow_type" AS ENUM('ready_stock', 'made_to_order', 'service');--> statement-breakpoint
CREATE TYPE "order_fulfillment_stage" AS ENUM('order_confirmed', 'artwork_submitted', 'artwork_approved', 'tooling_and_plates_ready', 'raw_material_sourced', 'in_production', 'quality_check_passed', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "shipment_status" AS ENUM('label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned');--> statement-breakpoint
CREATE TYPE "vendor_inquiry_status" AS ENUM('new', 'in_discussion', 'quote_sent', 'declined', 'closed');--> statement-breakpoint
CREATE TYPE "vendor_quotation_status" AS ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'superseded', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TABLE "business_requirements" (
	"id" uuid PRIMARY KEY,
	"business_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"packaging_use" "packaging_use" NOT NULL,
	"packaging_type" "packaging_type" NOT NULL,
	"quantity" varchar(120) NOT NULL,
	"size" varchar(255) NOT NULL,
	"material" varchar(255) NOT NULL,
	"branding_needed" boolean DEFAULT false NOT NULL,
	"delivery_location" text NOT NULL,
	"required_by_date" varchar(120) NOT NULL,
	"raw_description" text,
	"status" "business_requirement_status" DEFAULT 'requirement_received'::"business_requirement_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_products" (
	"id" uuid PRIMARY KEY,
	"sku" varchar(64) NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"vendor_type" "offering_vendor_type" DEFAULT 'manufacturer'::"offering_vendor_type" NOT NULL,
	"category_key" varchar(100) NOT NULL,
	"unit_of_measure" "offering_unit" NOT NULL,
	"specifications" jsonb DEFAULT '{}' NOT NULL,
	"images" jsonb DEFAULT '[]',
	"benchmark_unit_price" varchar(32),
	"default_lead_time_days" integer,
	"is_customizable" boolean DEFAULT false NOT NULL,
	"status" "catalog_product_status" DEFAULT 'published'::"catalog_product_status" NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_facilities" (
	"id" uuid PRIMARY KEY,
	"vendor_id" uuid NOT NULL UNIQUE,
	"facility_name" varchar(255),
	"factory_area_sq_ft" integer,
	"daily_capacity_units" integer,
	"monthly_capacity_units" integer,
	"operating_since_year" integer,
	"shift_count" integer DEFAULT 1,
	"printing_processes" varchar(64)[] DEFAULT '{}'::varchar(64)[],
	"max_print_colors" integer DEFAULT 4,
	"machinery_capabilities" jsonb DEFAULT '[]',
	"quality_testing_methods" varchar(120)[] DEFAULT '{}'::varchar(120)[],
	"certifications" jsonb DEFAULT '[]',
	"min_order_value" numeric(12,2) DEFAULT '0',
	"default_lead_time_days" integer DEFAULT 14,
	"accepts_custom_orders" boolean DEFAULT true NOT NULL,
	"factory_audited" boolean DEFAULT false NOT NULL,
	"audit_report_url" text,
	"audited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_fulfillment_milestones" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"workflow_type" "fulfillment_workflow_type" DEFAULT 'made_to_order'::"fulfillment_workflow_type" NOT NULL,
	"stage" "order_fulfillment_stage" NOT NULL,
	"stage_sequence" integer DEFAULT 1 NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"proof_images" jsonb DEFAULT '[]',
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_shipments" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"courier_partner" varchar(120) NOT NULL,
	"tracking_number" varchar(120) NOT NULL,
	"tracking_url" text,
	"package_weight_kg" numeric(8,2),
	"number_of_boxes" integer DEFAULT 1 NOT NULL,
	"status" "shipment_status" DEFAULT 'label_created'::"shipment_status" NOT NULL,
	"dispatched_at" timestamp DEFAULT now() NOT NULL,
	"estimated_delivery_date" timestamp,
	"delivered_at" timestamp,
	"delivery_proof_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_shipments_boxes_positive_check" CHECK ("number_of_boxes" > 0)
);
--> statement-breakpoint
CREATE TABLE "vendor_inquiries" (
	"id" uuid PRIMARY KEY,
	"vendor_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"catalog_product_id" uuid,
	"offering_id" uuid,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"quantity_requested" integer,
	"target_unit_price" numeric(12,4),
	"specifications" jsonb DEFAULT '{}',
	"status" "vendor_inquiry_status" DEFAULT 'new'::"vendor_inquiry_status" NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_quotation_price_tiers" (
	"id" uuid PRIMARY KEY,
	"quotation_id" uuid NOT NULL,
	"min_quantity" integer NOT NULL,
	"max_quantity" integer,
	"unit_price" numeric(12,4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotation_price_tiers_min_qty_check" CHECK ("min_quantity" > 0),
	CONSTRAINT "quotation_price_tiers_max_qty_check" CHECK ("max_quantity" IS NULL OR "max_quantity" >= "min_quantity"),
	CONSTRAINT "quotation_price_tiers_price_check" CHECK ("unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "vendor_quotations" (
	"id" uuid PRIMARY KEY,
	"quote_number" varchar(36) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_latest" boolean DEFAULT true NOT NULL,
	"requirement_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "vendor_quotation_status" DEFAULT 'submitted'::"vendor_quotation_status" NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"min_order_quantity" integer DEFAULT 1 NOT NULL,
	"base_unit_price" numeric(12,4) NOT NULL,
	"tax_percent" numeric(5,2) DEFAULT '18.00' NOT NULL,
	"price_includes_tax" boolean DEFAULT false NOT NULL,
	"tooling_or_die_cost" numeric(12,2) DEFAULT '0',
	"plate_charge" numeric(12,2) DEFAULT '0',
	"sample_available" boolean DEFAULT false NOT NULL,
	"sample_price" numeric(12,2),
	"sample_lead_time_days" integer,
	"production_lead_time_days_min" integer NOT NULL,
	"production_lead_time_days_max" integer NOT NULL,
	"estimated_delivery_days" integer NOT NULL,
	"shipping_terms" "offering_shipping_terms" NOT NULL,
	"payment_terms" "offering_payment_terms" NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"specifications_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"attachments" jsonb DEFAULT '[]',
	"notes" text,
	"rejection_reason" text,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_quotations_base_unit_price_check" CHECK ("base_unit_price" >= 0),
	CONSTRAINT "vendor_quotations_moq_positive_check" CHECK ("min_order_quantity" > 0),
	CONSTRAINT "vendor_quotations_lead_time_range_check" CHECK ("production_lead_time_days_min" >= 0 AND "production_lead_time_days_max" >= "production_lead_time_days_min"),
	CONSTRAINT "vendor_quotations_validity_window_check" CHECK ("valid_until" > "valid_from")
);
--> statement-breakpoint
CREATE TABLE "vendor_reviews" (
	"id" uuid PRIMARY KEY,
	"vendor_id" uuid NOT NULL,
	"order_id" uuid NOT NULL UNIQUE,
	"business_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"quality_rating" integer,
	"delivery_rating" integer,
	"communication_rating" integer,
	"title" varchar(200),
	"review" text,
	"vendor_reply" text,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_reviews_rating_range_check" CHECK ("overall_rating" >= 1 AND "overall_rating" <= 5)
);
--> statement-breakpoint
ALTER TABLE "offerings" ADD COLUMN "catalog_product_id" uuid;--> statement-breakpoint
ALTER TABLE "business_order_items" ALTER COLUMN "unit_price_snapshot" SET DATA TYPE numeric(12,4) USING "unit_price_snapshot"::numeric(12,4);--> statement-breakpoint
ALTER TABLE "offering_price_tiers" ALTER COLUMN "unit_price" SET DATA TYPE numeric(12,4) USING "unit_price"::numeric(12,4);--> statement-breakpoint
ALTER TABLE "offerings" ALTER COLUMN "unit_price" SET DATA TYPE numeric(12,4) USING "unit_price"::numeric(12,4);--> statement-breakpoint
CREATE INDEX "business_requirements_business_idx" ON "business_requirements" ("business_id");--> statement-breakpoint
CREATE INDEX "business_requirements_status_idx" ON "business_requirements" ("status");--> statement-breakpoint
CREATE INDEX "business_requirements_created_idx" ON "business_requirements" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_products_sku_unique" ON "catalog_products" ("sku");--> statement-breakpoint
CREATE INDEX "catalog_products_category_idx" ON "catalog_products" ("category_key");--> statement-breakpoint
CREATE INDEX "catalog_products_status_idx" ON "catalog_products" ("status");--> statement-breakpoint
CREATE INDEX "offerings_catalog_product_idx" ON "offerings" ("catalog_product_id");--> statement-breakpoint
CREATE INDEX "vendor_facilities_vendor_idx" ON "vendor_facilities" ("vendor_id");--> statement-breakpoint
CREATE INDEX "order_milestones_order_idx" ON "order_fulfillment_milestones" ("order_id");--> statement-breakpoint
CREATE INDEX "order_milestones_vendor_idx" ON "order_fulfillment_milestones" ("vendor_id");--> statement-breakpoint
CREATE INDEX "order_milestones_stage_idx" ON "order_fulfillment_milestones" ("order_id","stage");--> statement-breakpoint
CREATE INDEX "order_milestones_workflow_idx" ON "order_fulfillment_milestones" ("workflow_type","stage");--> statement-breakpoint
CREATE INDEX "order_shipments_order_idx" ON "order_shipments" ("order_id");--> statement-breakpoint
CREATE INDEX "order_shipments_vendor_idx" ON "order_shipments" ("vendor_id");--> statement-breakpoint
CREATE INDEX "order_shipments_tracking_idx" ON "order_shipments" ("tracking_number");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_vendor_status_idx" ON "vendor_inquiries" ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_business_idx" ON "vendor_inquiries" ("business_id");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_catalog_product_idx" ON "vendor_inquiries" ("catalog_product_id");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_created_idx" ON "vendor_inquiries" ("created_at");--> statement-breakpoint
CREATE INDEX "vendor_quotation_price_tiers_quotation_idx" ON "vendor_quotation_price_tiers" ("quotation_id","min_quantity");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_quotations_quote_version_unique" ON "vendor_quotations" ("quote_number","version");--> statement-breakpoint
CREATE INDEX "vendor_quotations_vendor_status_idx" ON "vendor_quotations" ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "vendor_quotations_requirement_idx" ON "vendor_quotations" ("requirement_id");--> statement-breakpoint
CREATE INDEX "vendor_quotations_validity_idx" ON "vendor_quotations" ("valid_until","status");--> statement-breakpoint
CREATE INDEX "vendor_quotations_created_idx" ON "vendor_quotations" ("created_at");--> statement-breakpoint
CREATE INDEX "vendor_reviews_vendor_idx" ON "vendor_reviews" ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_reviews_business_idx" ON "vendor_reviews" ("business_id");--> statement-breakpoint
ALTER TABLE "business_requirements" ADD CONSTRAINT "business_requirements_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_catalog_product_id_catalog_products_id_fkey" FOREIGN KEY ("catalog_product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vendor_facilities" ADD CONSTRAINT "vendor_facilities_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD CONSTRAINT "order_fulfillment_milestones_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD CONSTRAINT "order_fulfillment_milestones_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_catalog_product_id_catalog_products_id_fkey" FOREIGN KEY ("catalog_product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vendor_quotation_price_tiers" ADD CONSTRAINT "vendor_quotation_price_tiers_Tygtyu3g6PIx_fkey" FOREIGN KEY ("quotation_id") REFERENCES "vendor_quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_quotations" ADD CONSTRAINT "vendor_quotations_requirement_id_business_requirements_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "business_requirements"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_quotations" ADD CONSTRAINT "vendor_quotations_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE;