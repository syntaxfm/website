CREATE TYPE "public"."content_tag_sources" AS ENUM('AI', 'EDITOR');--> statement-breakpoint
CREATE TYPE "public"."tag_kinds" AS ENUM('TOPIC', 'LIBRARY');--> statement-breakpoint
CREATE TABLE "content_tagging" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"from_transcript" boolean NOT NULL,
	"tagged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_tags" ADD COLUMN "source" "content_tag_sources" DEFAULT 'EDITOR' NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "kind" "tag_kinds";--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "content_tagging" ADD CONSTRAINT "content_tagging_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tags_kind_idx" ON "tags" USING btree ("kind");