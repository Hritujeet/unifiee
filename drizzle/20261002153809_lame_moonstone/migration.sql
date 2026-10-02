CREATE TYPE "businesstype" AS ENUM('cafe', 'restaurant', 'qsr', 'cloud_kitchen', 'bakery');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('owner', 'manager', 'procurement');--> statement-breakpoint
CREATE TYPE "availability_status" AS ENUM('available', 'limited', 'unavailable');--> statement-breakpoint
CREATE TYPE "pricing_model" AS ENUM('per_project', 'hourly', 'per_design');--> statement-breakpoint
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
	"services" varchar(500)[],
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
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manufacturer" ADD CONSTRAINT "manufacturer_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "packaging_designers" ADD CONSTRAINT "packaging_designers_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;