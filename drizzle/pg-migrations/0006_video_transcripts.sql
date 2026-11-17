ALTER TABLE "transcripts" ALTER COLUMN "show_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "content_id" uuid;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "view_count" integer;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_content_id_unique" UNIQUE("content_id");