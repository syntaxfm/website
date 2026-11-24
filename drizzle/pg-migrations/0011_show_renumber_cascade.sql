ALTER TABLE "ai_show_notes" DROP CONSTRAINT "ai_show_notes_show_number_shows_number_fk";
--> statement-breakpoint
ALTER TABLE "show_guests" DROP CONSTRAINT "show_guests_show_id_shows_id_fk";
--> statement-breakpoint
ALTER TABLE "show_to_profile" DROP CONSTRAINT "show_to_profile_show_id_shows_id_fk";
--> statement-breakpoint
ALTER TABLE "transcripts" DROP CONSTRAINT "transcripts_show_number_shows_number_fk";
--> statement-breakpoint
ALTER TABLE "ai_show_notes" ADD CONSTRAINT "ai_show_notes_show_number_shows_number_fk" FOREIGN KEY ("show_number") REFERENCES "public"."shows"("number") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "show_guests" ADD CONSTRAINT "show_guests_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "show_to_profile" ADD CONSTRAINT "show_to_profile_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_show_number_shows_number_fk" FOREIGN KEY ("show_number") REFERENCES "public"."shows"("number") ON DELETE cascade ON UPDATE cascade;