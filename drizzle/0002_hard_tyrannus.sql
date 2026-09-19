ALTER TABLE "userTable" RENAME TO "user_meter";--> statement-breakpoint
ALTER TABLE "user_meter" DROP CONSTRAINT "userTable_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_meter" DROP CONSTRAINT "userTable_meter_id_meter_id_fk";
--> statement-breakpoint
ALTER TABLE "user_meter" ADD CONSTRAINT "user_meter_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_meter" ADD CONSTRAINT "user_meter_meter_id_meter_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meter"("id") ON DELETE cascade ON UPDATE no action;