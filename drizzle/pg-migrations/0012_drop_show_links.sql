ALTER TABLE "show_guests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "show_to_profile" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "show_guests" CASCADE;--> statement-breakpoint
DROP TABLE "show_to_profile" CASCADE;--> statement-breakpoint
ALTER TABLE "ai_show_notes" DROP CONSTRAINT "ai_show_notes_show_number_unique";--> statement-breakpoint
ALTER TABLE "transcripts" DROP CONSTRAINT "transcripts_show_number_unique";--> statement-breakpoint
ALTER TABLE "ai_show_notes" DROP CONSTRAINT "ai_show_notes_show_number_shows_number_fk";
--> statement-breakpoint
ALTER TABLE "transcripts" DROP CONSTRAINT "transcripts_show_number_shows_number_fk";
--> statement-breakpoint
DROP INDEX "ai_show_notes_show_number_idx";--> statement-breakpoint
DROP INDEX "transcripts_show_number_idx";--> statement-breakpoint
ALTER TABLE "ai_show_notes" DROP COLUMN "show_number";--> statement-breakpoint
ALTER TABLE "transcripts" DROP COLUMN "show_number";