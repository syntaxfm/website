CREATE TABLE "seo_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"credits_cost" integer NOT NULL,
	"report" jsonb NOT NULL,
	"errors" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "seo_snapshots_taken_at_idx" ON "seo_snapshots" USING btree ("taken_at");