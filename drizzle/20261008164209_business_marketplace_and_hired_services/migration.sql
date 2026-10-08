CREATE TYPE "hired_service_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "business_order_item_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "business_order_status" AS ENUM('draft', 'submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "offering_fulfilment_mode" AS ENUM('made_to_order', 'ready_stock', 'service');--> statement-breakpoint
CREATE TYPE "offering_payment_terms" AS ENUM('advance_100', 'advance_50', 'on_delivery', 'net_15', 'net_30');--> statement-breakpoint
CREATE TYPE "offering_shipping_terms" AS ENUM('vendor_pays', 'buyer_pays', 'included', 'pickup_only');--> statement-breakpoint
CREATE TYPE "offering_status" AS ENUM('draft', 'active', 'paused', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "offering_unit" AS ENUM('piece', 'pack', 'carton', 'kg', 'litre', 'roll', 'set', 'hour', 'project');--> statement-breakpoint
CREATE TYPE "offering_vendor_type" AS ENUM('manufacturer', 'supplier', 'vendor', 'distributor');--> statement-breakpoint
CREATE TABLE "business_hired_services" (
	"id" uuid PRIMARY KEY,
	"business_id" uuid NOT NULL,
	"service_id" uuid,
	"designer_id" uuid,
	"service_title" varchar(160) NOT NULL,
	"designer_name" varchar(300) NOT NULL,
	"designer_email" varchar(255) NOT NULL,
	"price" numeric(12,2) NOT NULL,
	"pricing_model" "pricing_model" NOT NULL,
	"turnaround_days" integer NOT NULL,
	"sample_image" text,
	"status" "hired_service_status" DEFAULT 'active'::"hired_service_status" NOT NULL,
	"hired_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_order_items" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"offering_id" uuid,
	"status" "business_order_item_status" DEFAULT 'pending'::"business_order_item_status" NOT NULL,
	"title_snapshot" varchar(240) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_of_measure_snapshot" "offering_unit" NOT NULL,
	"unit_price_snapshot" numeric(12,2) NOT NULL,
	"tax_percent_snapshot" numeric(5,2) NOT NULL,
	"price_includes_tax_snapshot" boolean NOT NULL,
	"fulfilment_mode_snapshot" "offering_fulfilment_mode" NOT NULL,
	"lead_time_days_min_snapshot" integer NOT NULL,
	"lead_time_days_max_snapshot" integer NOT NULL,
	"shipping_terms_snapshot" "offering_shipping_terms" NOT NULL,
	"hsn_sac_code_snapshot" varchar(32),
	"image_url_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_order_items_quantity_positive_check" CHECK ("quantity" > 0),
	CONSTRAINT "business_order_items_unit_price_nonnegative_check" CHECK ("unit_price_snapshot" >= 0)
);
--> statement-breakpoint
CREATE TABLE "business_orders" (
	"id" uuid PRIMARY KEY,
	"order_number" varchar(32) NOT NULL,
	"business_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "business_order_status" DEFAULT 'submitted'::"business_order_status" NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"subtotal" numeric(14,2) NOT NULL,
	"tax_total" numeric(14,2) DEFAULT '0' NOT NULL,
	"shipping_total" numeric(14,2) DEFAULT '0' NOT NULL,
	"total" numeric(14,2) NOT NULL,
	"payment_terms" "offering_payment_terms" NOT NULL,
	"notes" text,
	"shipping_address_line_1" varchar(255) NOT NULL,
	"shipping_address_line_2" varchar(255),
	"shipping_city" varchar(120) NOT NULL,
	"shipping_district" varchar(120),
	"shipping_state" varchar(120) NOT NULL,
	"shipping_pincode" varchar(16) NOT NULL,
	"shipping_country" varchar(100) DEFAULT 'India' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	CONSTRAINT "business_orders_amounts_nonnegative_check" CHECK ("subtotal" >= 0 AND "tax_total" >= 0 AND "shipping_total" >= 0 AND "total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "offering_images" (
	"id" uuid PRIMARY KEY,
	"offering_id" uuid NOT NULL,
	"url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offering_price_tiers" (
	"id" uuid PRIMARY KEY,
	"offering_id" uuid NOT NULL,
	"min_quantity" integer NOT NULL,
	"max_quantity" integer,
	"unit_price" numeric(12,2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offering_price_tiers_min_quantity_positive_check" CHECK ("min_quantity" > 0),
	CONSTRAINT "offering_price_tiers_max_quantity_check" CHECK ("max_quantity" IS NULL OR "max_quantity" >= "min_quantity"),
	CONSTRAINT "offering_price_tiers_unit_price_nonnegative_check" CHECK ("unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "offering_types" (
	"key" varchar(100) PRIMARY KEY,
	"display_name" varchar(160) NOT NULL,
	"vendor_type" "offering_vendor_type" NOT NULL,
	"field_definitions" jsonb DEFAULT '[]' NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" uuid PRIMARY KEY,
	"vendor_id" uuid NOT NULL,
	"vendor_type" "offering_vendor_type" DEFAULT 'manufacturer'::"offering_vendor_type" NOT NULL,
	"offering_type" varchar(100) NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"unit_of_measure" "offering_unit" NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"min_order_quantity" integer DEFAULT 1 NOT NULL,
	"max_order_quantity" integer,
	"quantity_step" integer DEFAULT 1 NOT NULL,
	"stock_available" integer,
	"fulfilment_mode" "offering_fulfilment_mode" NOT NULL,
	"lead_time_days_min" integer NOT NULL,
	"lead_time_days_max" integer NOT NULL,
	"tax_percent" numeric(5,2) DEFAULT '0' NOT NULL,
	"hsn_sac_code" varchar(32),
	"price_includes_tax" boolean DEFAULT false NOT NULL,
	"shipping_terms" "offering_shipping_terms" NOT NULL,
	"shipping_cost_note" text,
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(120) NOT NULL,
	"district" varchar(120),
	"state" varchar(120) NOT NULL,
	"pincode" varchar(16) NOT NULL,
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"latitude" numeric(10,7),
	"longitude" numeric(10,7),
	"payment_terms" "offering_payment_terms" NOT NULL,
	"sample_available" boolean DEFAULT false NOT NULL,
	"sample_price" numeric(12,2),
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"status" "offering_status" DEFAULT 'draft'::"offering_status" NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "offerings_unit_price_nonnegative_check" CHECK ("unit_price" >= 0),
	CONSTRAINT "offerings_min_order_quantity_positive_check" CHECK ("min_order_quantity" > 0),
	CONSTRAINT "offerings_max_order_quantity_check" CHECK ("max_order_quantity" IS NULL OR "max_order_quantity" >= "min_order_quantity"),
	CONSTRAINT "offerings_quantity_step_positive_check" CHECK ("quantity_step" > 0),
	CONSTRAINT "offerings_stock_nonnegative_check" CHECK ("stock_available" IS NULL OR "stock_available" >= 0),
	CONSTRAINT "offerings_lead_time_check" CHECK ("lead_time_days_min" >= 0 AND "lead_time_days_max" >= "lead_time_days_min"),
	CONSTRAINT "offerings_tax_percent_check" CHECK ("tax_percent" >= 0 AND "tax_percent" <= 100),
	CONSTRAINT "offerings_validity_window_check" CHECK ("valid_until" > "valid_from")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "business_hired_services_business_service_active_unique" ON "business_hired_services" ("business_id","service_id") WHERE "status" = 'active';--> statement-breakpoint
CREATE INDEX "business_hired_services_business_status_idx" ON "business_hired_services" ("business_id","status");--> statement-breakpoint
CREATE INDEX "business_order_items_order_idx" ON "business_order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "business_order_items_offering_idx" ON "business_order_items" ("offering_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_orders_order_number_unique" ON "business_orders" ("order_number");--> statement-breakpoint
CREATE INDEX "business_orders_business_created_idx" ON "business_orders" ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "business_orders_vendor_status_idx" ON "business_orders" ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "offering_images_offering_order_idx" ON "offering_images" ("offering_id","display_order");--> statement-breakpoint
CREATE INDEX "offering_price_tiers_offering_idx" ON "offering_price_tiers" ("offering_id","min_quantity");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_types_vendor_key_unique" ON "offering_types" ("vendor_type","key");--> statement-breakpoint
CREATE INDEX "offerings_vendor_id_idx" ON "offerings" ("vendor_id");--> statement-breakpoint
CREATE INDEX "offerings_vendor_type_idx" ON "offerings" ("vendor_type");--> statement-breakpoint
CREATE INDEX "offerings_offering_type_idx" ON "offerings" ("offering_type");--> statement-breakpoint
CREATE INDEX "offerings_status_valid_until_idx" ON "offerings" ("status","valid_until");--> statement-breakpoint
CREATE INDEX "offerings_state_city_idx" ON "offerings" ("state","city");--> statement-breakpoint
ALTER TABLE "business_hired_services" ADD CONSTRAINT "business_hired_services_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business_hired_services" ADD CONSTRAINT "business_hired_services_service_id_designer_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "designer_services"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "business_hired_services" ADD CONSTRAINT "business_hired_services_designer_id_packaging_designers_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "packaging_designers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "business_order_items" ADD CONSTRAINT "business_order_items_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business_order_items" ADD CONSTRAINT "business_order_items_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "offering_images" ADD CONSTRAINT "offering_images_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offering_price_tiers" ADD CONSTRAINT "offering_price_tiers_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_offering_type_offering_types_key_fkey" FOREIGN KEY ("offering_type") REFERENCES "offering_types"("key") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;