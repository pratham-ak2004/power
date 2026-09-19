CREATE TABLE "bill" (
	"id" text PRIMARY KEY NOT NULL,
	"previous_reading" numeric(10, 2) NOT NULL,
	"current_reading" numeric(10, 2) NOT NULL,
	"total" numeric(8, 2) NOT NULL,
	"payable" numeric(8, 2) NOT NULL,
	"meter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meter" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rr_number" text NOT NULL,
	"start_reading" numeric(10, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meter_rr_number_unique" UNIQUE("rr_number")
);
--> statement-breakpoint
CREATE TABLE "reading" (
	"id" text PRIMARY KEY NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"meter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userTable" (
	"user_id" text NOT NULL,
	"meter_id" text NOT NULL,
	"creator" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bill" ADD CONSTRAINT "bill_meter_id_meter_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading" ADD CONSTRAINT "reading_meter_id_meter_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userTable" ADD CONSTRAINT "userTable_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userTable" ADD CONSTRAINT "userTable_meter_id_meter_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meter"("id") ON DELETE cascade ON UPDATE no action;