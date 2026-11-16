CREATE TABLE "tag_redirects" (
	"old_slug" varchar(64) PRIMARY KEY NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tag_redirects" ADD CONSTRAINT "tag_redirects_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;