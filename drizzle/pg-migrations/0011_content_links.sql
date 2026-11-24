CREATE TABLE "content_guests" (
	"content_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"position" serial NOT NULL,
	CONSTRAINT "content_guests_content_id_guest_id_pk" PRIMARY KEY("content_id","guest_id")
);
--> statement-breakpoint
CREATE TABLE "content_hosts" (
	"content_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"position" serial NOT NULL,
	CONSTRAINT "content_hosts_content_id_profile_id_pk" PRIMARY KEY("content_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "ai_show_notes" ALTER COLUMN "show_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_show_notes" ADD COLUMN "content_id" uuid;--> statement-breakpoint
ALTER TABLE "content_guests" ADD CONSTRAINT "content_guests_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_guests" ADD CONSTRAINT "content_guests_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_hosts" ADD CONSTRAINT "content_hosts_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_hosts" ADD CONSTRAINT "content_hosts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_guests_guest_id_idx" ON "content_guests" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "content_hosts_profile_id_idx" ON "content_hosts" USING btree ("profile_id");--> statement-breakpoint
ALTER TABLE "ai_show_notes" ADD CONSTRAINT "ai_show_notes_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_show_notes" ADD CONSTRAINT "ai_show_notes_content_id_unique" UNIQUE("content_id");