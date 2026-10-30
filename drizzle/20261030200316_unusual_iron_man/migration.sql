CREATE TYPE "businesstype" AS ENUM('cafe', 'restaurant', 'qsr', 'cloud_kitchen', 'bakery');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('owner', 'manager', 'procurement');--> statement-breakpoint
CREATE TYPE "availability_status" AS ENUM('available', 'limited', 'unavailable');--> statement-breakpoint
CREATE TYPE "pricing_model" AS ENUM('per_project', 'hourly', 'per_design');--> statement-breakpoint
CREATE TYPE "designer_service_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "offering_fulfilment_mode" AS ENUM('made_to_order', 'ready_stock', 'service');--> statement-breakpoint
CREATE TYPE "offering_payment_terms" AS ENUM('advance_100', 'advance_50', 'on_delivery', 'net_15', 'net_30');--> statement-breakpoint
CREATE TYPE "offering_shipping_terms" AS ENUM('vendor_pays', 'buyer_pays', 'included', 'pickup_only');--> statement-breakpoint
CREATE TYPE "offering_status" AS ENUM('draft', 'active', 'paused', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "offering_unit" AS ENUM('piece', 'pack', 'carton', 'kg', 'litre', 'roll', 'set', 'hour', 'project');--> statement-breakpoint
CREATE TYPE "offering_vendor_type" AS ENUM('manufacturer', 'supplier', 'vendor', 'distributor');--> statement-breakpoint
CREATE TYPE "business_requirement_status" AS ENUM('requirement_received', 'quoted', 'order_confirmed', 'in_production', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "packaging_type" AS ENUM('cups', 'boxes', 'bags', 'cutlery', 'containers', 'custom');--> statement-breakpoint
CREATE TYPE "packaging_use" AS ENUM('coffee', 'food', 'dessert', 'delivery', 'takeaway', 'other');--> statement-breakpoint
CREATE TYPE "business_order_item_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "business_order_status" AS ENUM('draft', 'submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "hired_service_status" AS ENUM('active', 'in_review', 'completed');--> statement-breakpoint
CREATE TYPE "order_fulfillment_stage" AS ENUM('order_confirmed', 'artwork_approved', 'raw_material_sourced', 'in_production', 'quality_check_passed', 'packed', 'dispatched', 'delivered');--> statement-breakpoint
CREATE TYPE "shipment_status" AS ENUM('label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned');--> statement-breakpoint
CREATE TYPE "vendor_inquiry_status" AS ENUM('new', 'in_discussion', 'quote_sent', 'declined', 'closed');--> statement-breakpoint
CREATE TYPE "vendor_quotation_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "vendor_invoice_status" AS ENUM('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "bank_account_type" AS ENUM('current', 'savings');--> statement-breakpoint
CREATE TYPE "ai_entity_type" AS ENUM('requirement', 'offer', 'gig', 'designer_profile', 'help_doc');--> statement-breakpoint
CREATE TYPE "ai_visibility_scope" AS ENUM('public', 'private', 'role_restricted');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT true NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business" (
	"id" uuid PRIMARY KEY UNIQUE,
	"user_id" text NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"fullname" varchar(300) NOT NULL,
	"ownername" varchar(300) NOT NULL,
	"businessname" varchar(500) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"phone" varchar(255) NOT NULL UNIQUE,
	"businesstype" "businesstype" NOT NULL,
	"businessAddress" text NOT NULL,
	"role" "role" NOT NULL,
	"gstin" varchar(15),
	"website" varchar(500),
	"social" varchar(500)[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturer" (
	"id" uuid PRIMARY KEY UNIQUE,
	"user_id" text NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"fullname" varchar(300) NOT NULL,
	"companyname" varchar(500) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"phone" varchar(255) NOT NULL UNIQUE,
	"packaging_categories" varchar(100)[],
	"capabilities" varchar(100)[],
	"manufacturer_address" text,
	"gstin" varchar(15),
	"socials" varchar(500)[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
	"packaging_design_specializations" json,
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
--> statement-breakpoint
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
	"unit_price" numeric(12,4) NOT NULL,
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
	"catalog_product_id" uuid,
	"vendor_id" uuid NOT NULL,
	"vendor_type" "offering_vendor_type" DEFAULT 'manufacturer'::"offering_vendor_type" NOT NULL,
	"offering_type" varchar(100) NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"unit_of_measure" "offering_unit" NOT NULL,
	"unit_price" numeric(12,4) NOT NULL,
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
	"created_by" text,
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
	CONSTRAINT "offerings_validity_window_check" CHECK ("valid_until" > "valid_from"),
	CONSTRAINT "offerings_vendor_type_supported_check" CHECK ("vendor_type" = 'manufacturer')
);
--> statement-breakpoint
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
CREATE TABLE "business_order_items" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"offering_id" uuid,
	"status" "business_order_item_status" DEFAULT 'pending'::"business_order_item_status" NOT NULL,
	"title_snapshot" varchar(240) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_of_measure_snapshot" "offering_unit" NOT NULL,
	"unit_price_snapshot" numeric(12,4) NOT NULL,
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
	"quote_id" uuid,
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
	"cancelled_at" timestamp,
	"cancellation_role" varchar(32),
	"cancellation_reason" text,
	CONSTRAINT "business_orders_amounts_nonnegative_check" CHECK ("subtotal" >= 0 AND "tax_total" >= 0 AND "shipping_total" >= 0 AND "total" >= 0)
);
--> statement-breakpoint
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
	"notes" text,
	"status" "hired_service_status" DEFAULT 'active'::"hired_service_status" NOT NULL,
	"hired_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_hired_services_completion_check" CHECK (
        ("status" = 'completed'::hired_service_status AND "completed_at" IS NOT NULL)
        OR ("status" <> 'completed'::hired_service_status AND "completed_at" IS NULL)
    )
);
--> statement-breakpoint
CREATE TABLE "vendor_facilities" (
	"id" uuid PRIMARY KEY,
	"vendor_id" uuid NOT NULL UNIQUE,
	"facility_name" varchar(255),
	"factory_area_sq_ft" integer,
	"daily_capacity_units" varchar(120),
	"operating_since_year" integer,
	"shift_count" integer DEFAULT 1,
	"machinery" jsonb DEFAULT '[]',
	"certifications" jsonb DEFAULT '[]',
	"quality_testing_methods" jsonb DEFAULT '[]',
	"min_order_value" numeric(12,2) DEFAULT '0',
	"default_lead_time_days" integer DEFAULT 14,
	"accepts_custom_orders" boolean DEFAULT true NOT NULL,
	"factory_audited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_fulfillment_milestones" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"stage" "order_fulfillment_stage" NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"proof_images" jsonb DEFAULT '[]',
	"completed_at" timestamp DEFAULT now() NOT NULL,
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
CREATE TABLE "vendor_quotations" (
	"id" uuid PRIMARY KEY,
	"quote_number" varchar(36) NOT NULL,
	"requirement_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "vendor_quotation_status" DEFAULT 'pending'::"vendor_quotation_status" NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"total_price" numeric(14,2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"quantity" integer NOT NULL,
	"production_lead_time_days" integer NOT NULL,
	"estimated_delivery_days" integer NOT NULL,
	"sample_available" boolean DEFAULT false NOT NULL,
	"sample_price" numeric(12,2),
	"shipping_terms" "offering_shipping_terms" NOT NULL,
	"payment_terms" "offering_payment_terms" NOT NULL,
	"valid_until" timestamp NOT NULL,
	"notes" text,
	"specs" jsonb DEFAULT '{}',
	"attachments" jsonb DEFAULT '[]',
	"rejection_reason" text,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_quotations_unit_price_check" CHECK ("unit_price" >= 0),
	CONSTRAINT "vendor_quotations_total_price_check" CHECK ("total_price" >= 0),
	CONSTRAINT "vendor_quotations_quantity_positive_check" CHECK ("quantity" > 0),
	CONSTRAINT "vendor_quotations_lead_time_positive_check" CHECK ("production_lead_time_days" >= 0)
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
CREATE TABLE "vendor_invoices" (
	"id" uuid PRIMARY KEY,
	"invoice_number" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"subtotal" numeric(14,2) NOT NULL,
	"tax_total" numeric(14,2) DEFAULT '0' NOT NULL,
	"shipping_total" numeric(14,2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(14,2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"hsn_sac_breakdown" jsonb DEFAULT '[]',
	"eway_bill_number" varchar(50),
	"invoice_pdf_url" text,
	"status" "vendor_invoice_status" DEFAULT 'issued'::"vendor_invoice_status" NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_invoices_amounts_check" CHECK ("subtotal" >= 0 AND "tax_total" >= 0 AND "grand_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "vendor_payout_accounts" (
	"id" uuid PRIMARY KEY,
	"vendor_id" uuid NOT NULL UNIQUE,
	"account_holder_name" varchar(255) NOT NULL,
	"account_number" varchar(64) NOT NULL,
	"ifsc_code" varchar(16) NOT NULL,
	"bank_name" varchar(120) NOT NULL,
	"branch" varchar(120),
	"account_type" "bank_account_type" DEFAULT 'current'::"bank_account_type" NOT NULL,
	"upi_id" varchar(100),
	"is_primary" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_documents" (
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
--> statement-breakpoint
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
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "offering_images_offering_order_idx" ON "offering_images" ("offering_id","display_order");--> statement-breakpoint
CREATE INDEX "offering_price_tiers_offering_idx" ON "offering_price_tiers" ("offering_id","min_quantity");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_types_vendor_key_unique" ON "offering_types" ("vendor_type","key");--> statement-breakpoint
CREATE INDEX "offerings_catalog_product_idx" ON "offerings" ("catalog_product_id");--> statement-breakpoint
CREATE INDEX "offerings_vendor_id_idx" ON "offerings" ("vendor_id");--> statement-breakpoint
CREATE INDEX "offerings_created_by_idx" ON "offerings" ("created_by");--> statement-breakpoint
CREATE INDEX "offerings_vendor_type_idx" ON "offerings" ("vendor_type");--> statement-breakpoint
CREATE INDEX "offerings_offering_type_idx" ON "offerings" ("offering_type");--> statement-breakpoint
CREATE INDEX "offerings_status_valid_until_idx" ON "offerings" ("status","valid_until");--> statement-breakpoint
CREATE INDEX "offerings_state_city_idx" ON "offerings" ("state","city");--> statement-breakpoint
CREATE INDEX "business_requirements_business_idx" ON "business_requirements" ("business_id");--> statement-breakpoint
CREATE INDEX "business_requirements_status_idx" ON "business_requirements" ("status");--> statement-breakpoint
CREATE INDEX "business_requirements_created_idx" ON "business_requirements" ("created_at");--> statement-breakpoint
CREATE INDEX "business_order_items_order_idx" ON "business_order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "business_order_items_offering_idx" ON "business_order_items" ("offering_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_orders_order_number_unique" ON "business_orders" ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "business_orders_quote_unique" ON "business_orders" ("quote_id");--> statement-breakpoint
CREATE INDEX "business_orders_business_created_idx" ON "business_orders" ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "business_orders_vendor_status_idx" ON "business_orders" ("vendor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "business_hired_services_business_service_active_unique" ON "business_hired_services" ("business_id","service_id") WHERE "status" = 'active'::hired_service_status;--> statement-breakpoint
CREATE INDEX "business_hired_services_business_status_idx" ON "business_hired_services" ("business_id","status");--> statement-breakpoint
CREATE INDEX "business_hired_services_service_idx" ON "business_hired_services" ("service_id");--> statement-breakpoint
CREATE INDEX "business_hired_services_designer_idx" ON "business_hired_services" ("designer_id");--> statement-breakpoint
CREATE INDEX "vendor_facilities_vendor_idx" ON "vendor_facilities" ("vendor_id");--> statement-breakpoint
CREATE INDEX "order_milestones_order_idx" ON "order_fulfillment_milestones" ("order_id");--> statement-breakpoint
CREATE INDEX "order_milestones_vendor_idx" ON "order_fulfillment_milestones" ("vendor_id");--> statement-breakpoint
CREATE INDEX "order_milestones_stage_idx" ON "order_fulfillment_milestones" ("order_id","stage");--> statement-breakpoint
CREATE UNIQUE INDEX "order_milestones_order_stage_unique" ON "order_fulfillment_milestones" ("order_id","stage");--> statement-breakpoint
CREATE INDEX "order_shipments_order_idx" ON "order_shipments" ("order_id");--> statement-breakpoint
CREATE INDEX "order_shipments_vendor_idx" ON "order_shipments" ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_vendor_status_idx" ON "vendor_inquiries" ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_business_idx" ON "vendor_inquiries" ("business_id");--> statement-breakpoint
CREATE INDEX "vendor_inquiries_created_idx" ON "vendor_inquiries" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_quotations_quote_number_unique" ON "vendor_quotations" ("quote_number");--> statement-breakpoint
CREATE INDEX "vendor_quotations_vendor_status_idx" ON "vendor_quotations" ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "vendor_quotations_requirement_idx" ON "vendor_quotations" ("requirement_id");--> statement-breakpoint
CREATE INDEX "vendor_reviews_vendor_idx" ON "vendor_reviews" ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_reviews_order_idx" ON "vendor_reviews" ("order_id");--> statement-breakpoint
CREATE INDEX "vendor_reviews_business_idx" ON "vendor_reviews" ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_invoices_invoice_number_unique" ON "vendor_invoices" ("invoice_number");--> statement-breakpoint
CREATE INDEX "vendor_invoices_vendor_status_idx" ON "vendor_invoices" ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "vendor_invoices_order_idx" ON "vendor_invoices" ("order_id");--> statement-breakpoint
CREATE INDEX "vendor_invoices_business_idx" ON "vendor_invoices" ("business_id");--> statement-breakpoint
CREATE INDEX "vendor_payout_vendor_idx" ON "vendor_payout_accounts" ("vendor_id");--> statement-breakpoint
CREATE INDEX "ai_documents_embedding_hnsw_idx" ON "ai_documents" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "ai_documents_entity_type_id_idx" ON "ai_documents" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ai_documents_owner_id_idx" ON "ai_documents" ("owner_id");--> statement-breakpoint
CREATE INDEX "ai_documents_visibility_idx" ON "ai_documents" ("visibility_scope");--> statement-breakpoint
CREATE INDEX "ai_documents_content_hash_idx" ON "ai_documents" ("content_hash");--> statement-breakpoint
CREATE INDEX "ai_documents_content_fts_idx" ON "ai_documents" USING gin (to_tsvector('english', "content"));--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_records_scope_key_user_unique" ON "idempotency_records" ("scope","key","user_id");--> statement-breakpoint
CREATE INDEX "idempotency_records_expires_idx" ON "idempotency_records" ("expires_at");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manufacturer" ADD CONSTRAINT "manufacturer_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "packaging_designers" ADD CONSTRAINT "packaging_designers_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "designer_services" ADD CONSTRAINT "designer_services_designer_id_packaging_designers_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "packaging_designers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offering_images" ADD CONSTRAINT "offering_images_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offering_price_tiers" ADD CONSTRAINT "offering_price_tiers_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_type_vendor_fk" FOREIGN KEY ("vendor_type","offering_type") REFERENCES "offering_types"("vendor_type","key") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "business_requirements" ADD CONSTRAINT "business_requirements_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business_order_items" ADD CONSTRAINT "business_order_items_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business_order_items" ADD CONSTRAINT "business_order_items_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_quote_id_vendor_quotations_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "vendor_quotations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "business_orders" ADD CONSTRAINT "business_orders_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "business_hired_services" ADD CONSTRAINT "business_hired_services_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business_hired_services" ADD CONSTRAINT "business_hired_services_service_id_designer_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "designer_services"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "business_hired_services" ADD CONSTRAINT "business_hired_services_designer_id_packaging_designers_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "packaging_designers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vendor_facilities" ADD CONSTRAINT "vendor_facilities_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD CONSTRAINT "order_fulfillment_milestones_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_fulfillment_milestones" ADD CONSTRAINT "order_fulfillment_milestones_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vendor_quotations" ADD CONSTRAINT "vendor_quotations_requirement_id_business_requirements_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "business_requirements"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_quotations" ADD CONSTRAINT "vendor_quotations_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_order_id_business_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "business_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_business_id_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendor_payout_accounts" ADD CONSTRAINT "vendor_payout_accounts_vendor_id_manufacturer_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "manufacturer"("id") ON DELETE RESTRICT;