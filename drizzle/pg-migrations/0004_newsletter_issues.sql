CREATE TABLE "newsletter_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_number" integer,
	"content_id" uuid NOT NULL,
	CONSTRAINT "newsletter_issues_content_id_unique" UNIQUE("content_id")
);
--> statement-breakpoint
ALTER TABLE "newsletter_issues" ADD CONSTRAINT "newsletter_issues_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_issues_content_id_idx" ON "newsletter_issues" USING btree ("content_id");