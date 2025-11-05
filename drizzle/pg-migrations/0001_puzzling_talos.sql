ALTER TABLE "shows" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shows" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "show_guests" ALTER COLUMN "show_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "show_to_user" ALTER COLUMN "show_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "show_videos" ALTER COLUMN "show_id" SET DATA TYPE text;