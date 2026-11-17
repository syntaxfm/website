CREATE TABLE "oauth_connections" (
	"provider" varchar(32) PRIMARY KEY NOT NULL,
	"refresh_token" text NOT NULL,
	"account_name" text,
	"connected_by" uuid,
	"connected_at" timestamp with time zone NOT NULL,
	"failed_at" timestamp with time zone,
	"failure" text
);
--> statement-breakpoint
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_connected_by_profiles_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;