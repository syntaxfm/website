CREATE TYPE "public"."show_type" AS ENUM('HASTY', 'TASTY', 'SUPPER', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."user_submission_status" AS ENUM('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."user_submission_type" AS ENUM('POTLUCK', 'SPOOKY', 'GUEST', 'FEEDBACK', 'OTHER', 'OSS');--> statement-breakpoint
CREATE TABLE "ai_guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_note_id" integer NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_show_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_number" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" varchar(1500) NOT NULL,
	"provider" varchar(100) DEFAULT 'gpt3.5' NOT NULL,
	CONSTRAINT "ai_show_notes_show_number_unique" UNIQUE("show_number")
);
--> statement-breakpoint
CREATE TABLE "ai_summary_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_note_id" integer NOT NULL,
	"time" varchar(50) NOT NULL,
	"text" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "ai_tweets" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_note_id" integer NOT NULL,
	"content" varchar(350) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_slug" varchar(255) NOT NULL,
	"twitter" varchar(255),
	"github" varchar(255),
	"url" text,
	"of" text DEFAULT '',
	CONSTRAINT "guests_name_slug_unique" UNIQUE("name_slug"),
	CONSTRAINT "guests_twitter_unique" UNIQUE("twitter"),
	CONSTRAINT "guests_github_unique" UNIQUE("github")
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_note_id" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"url" text NOT NULL,
	"timestamp" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"description" text,
	"unlisted" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "playlists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "playlist_videos" (
	"playlist_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "playlist_videos_playlist_id_video_id_pk" PRIMARY KEY("playlist_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "remote_playlists" (
	"playlist_id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"videos_count" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"session_token" varchar(255) NOT NULL,
	"access_token" varchar(255),
	"ip" varchar(50),
	"country" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "sessions_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(500) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"url" text NOT NULL,
	"youtube_url" text,
	"spotify_id" varchar(255),
	"show_notes" text NOT NULL,
	"show_type" "show_type" DEFAULT 'SPECIAL' NOT NULL,
	"hash" varchar(100) NOT NULL,
	"md_file" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shows_number_unique" UNIQUE("number"),
	CONSTRAINT "shows_hash_unique" UNIQUE("hash"),
	CONSTRAINT "shows_md_file_unique" UNIQUE("md_file")
);
--> statement-breakpoint
CREATE TABLE "show_guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"transcript_id" uuid
);
--> statement-breakpoint
CREATE TABLE "show_to_user" (
	"show_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "show_to_user_show_id_user_id_pk" PRIMARY KEY("show_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "show_videos" (
	"show_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	CONSTRAINT "show_videos_show_id_video_id_pk" PRIMARY KEY("show_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"link" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_note_id" integer NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_number" integer NOT NULL,
	CONSTRAINT "transcripts_show_number_unique" UNIQUE("show_number")
);
--> statement-breakpoint
CREATE TABLE "transcript_utterances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transcript_id" uuid NOT NULL,
	"start" double precision NOT NULL,
	"end" double precision NOT NULL,
	"confidence" double precision NOT NULL,
	"channel" integer NOT NULL,
	"speaker" integer NOT NULL,
	"speaker_name" varchar(255),
	"transcript_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_utterance_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transcript_utterance_id" uuid NOT NULL,
	"word" varchar(255) NOT NULL,
	"punctuated_word" varchar(255) NOT NULL,
	"start" double precision NOT NULL,
	"end" double precision NOT NULL,
	"confidence" double precision NOT NULL,
	"speaker" integer NOT NULL,
	"speaker_confidence" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" integer NOT NULL,
	"username" varchar(255),
	"name" varchar(255),
	"email" varchar(255),
	"avatar_url" text,
	"twitter" varchar(255),
	"theme" varchar(50) DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"body" text NOT NULL,
	"audio_url" text,
	"status" "user_submission_status" DEFAULT 'PENDING' NOT NULL,
	"submission_type" "user_submission_type" DEFAULT 'OTHER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"thumbnail" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	CONSTRAINT "videos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ai_guests" ADD CONSTRAINT "ai_guests_show_note_id_ai_show_notes_id_fk" FOREIGN KEY ("show_note_id") REFERENCES "public"."ai_show_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_show_notes" ADD CONSTRAINT "ai_show_notes_show_number_shows_number_fk" FOREIGN KEY ("show_number") REFERENCES "public"."shows"("number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_summary_entries" ADD CONSTRAINT "ai_summary_entries_show_note_id_ai_show_notes_id_fk" FOREIGN KEY ("show_note_id") REFERENCES "public"."ai_show_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tweets" ADD CONSTRAINT "ai_tweets_show_note_id_ai_show_notes_id_fk" FOREIGN KEY ("show_note_id") REFERENCES "public"."ai_show_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_show_note_id_ai_show_notes_id_fk" FOREIGN KEY ("show_note_id") REFERENCES "public"."ai_show_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_videos" ADD CONSTRAINT "playlist_videos_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_videos" ADD CONSTRAINT "playlist_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_guests" ADD CONSTRAINT "show_guests_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_guests" ADD CONSTRAINT "show_guests_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_guests" ADD CONSTRAINT "show_guests_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_to_user" ADD CONSTRAINT "show_to_user_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_to_user" ADD CONSTRAINT "show_to_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_videos" ADD CONSTRAINT "show_videos_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_videos" ADD CONSTRAINT "show_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_show_note_id_ai_show_notes_id_fk" FOREIGN KEY ("show_note_id") REFERENCES "public"."ai_show_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_show_number_shows_number_fk" FOREIGN KEY ("show_number") REFERENCES "public"."shows"("number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_utterances" ADD CONSTRAINT "transcript_utterances_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_utterance_words" ADD CONSTRAINT "tuw_utterance_fk" FOREIGN KEY ("transcript_utterance_id") REFERENCES "public"."transcript_utterances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_guests_show_note_id_idx" ON "ai_guests" USING btree ("show_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_show_notes_show_number_idx" ON "ai_show_notes" USING btree ("show_number");--> statement-breakpoint
CREATE INDEX "ai_summary_entries_show_note_id_idx" ON "ai_summary_entries" USING btree ("show_note_id");--> statement-breakpoint
CREATE INDEX "ai_tweets_show_note_id_idx" ON "ai_tweets" USING btree ("show_note_id");--> statement-breakpoint
CREATE INDEX "guests_name_idx" ON "guests" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_name_slug_idx" ON "guests" USING btree ("name_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_twitter_idx" ON "guests" USING btree ("twitter");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_github_idx" ON "guests" USING btree ("github");--> statement-breakpoint
CREATE INDEX "links_show_note_id_idx" ON "links" USING btree ("show_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "playlists_slug_idx" ON "playlists" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "playlist_videos_playlist_id_idx" ON "playlist_videos" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "playlist_videos_video_id_idx" ON "playlist_videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "playlist_videos_order_idx" ON "playlist_videos" USING btree ("playlist_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_session_token_idx" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_access_token_idx" ON "sessions" USING btree ("access_token");--> statement-breakpoint
CREATE UNIQUE INDEX "shows_number_idx" ON "shows" USING btree ("number");--> statement-breakpoint
CREATE INDEX "shows_date_idx" ON "shows" USING btree ("date");--> statement-breakpoint
CREATE INDEX "shows_number_date_idx" ON "shows" USING btree ("number","date");--> statement-breakpoint
CREATE UNIQUE INDEX "shows_hash_idx" ON "shows" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "shows_md_file_idx" ON "shows" USING btree ("md_file");--> statement-breakpoint
CREATE INDEX "shows_show_type_idx" ON "shows" USING btree ("show_type");--> statement-breakpoint
CREATE UNIQUE INDEX "show_guests_show_guest_idx" ON "show_guests" USING btree ("show_id","guest_id");--> statement-breakpoint
CREATE INDEX "show_guests_show_id_idx" ON "show_guests" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "show_guests_guest_id_idx" ON "show_guests" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "show_guests_transcript_id_idx" ON "show_guests" USING btree ("transcript_id");--> statement-breakpoint
CREATE INDEX "show_to_user_show_id_idx" ON "show_to_user" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "show_to_user_user_id_idx" ON "show_to_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "show_videos_show_id_idx" ON "show_videos" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "show_videos_video_id_idx" ON "show_videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "social_links_guest_id_idx" ON "social_links" USING btree ("guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "social_links_link_guest_idx" ON "social_links" USING btree ("link","guest_id");--> statement-breakpoint
CREATE INDEX "topics_show_note_id_idx" ON "topics" USING btree ("show_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transcripts_show_number_idx" ON "transcripts" USING btree ("show_number");--> statement-breakpoint
CREATE INDEX "transcript_utterances_transcript_id_idx" ON "transcript_utterances" USING btree ("transcript_id");--> statement-breakpoint
CREATE INDEX "transcript_utterances_start_idx" ON "transcript_utterances" USING btree ("start");--> statement-breakpoint
CREATE INDEX "transcript_utterances_speaker_idx" ON "transcript_utterances" USING btree ("speaker");--> statement-breakpoint
CREATE INDEX "transcript_utterance_words_utterance_id_idx" ON "transcript_utterance_words" USING btree ("transcript_utterance_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_id_idx" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_role_idx" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_submissions_status_idx" ON "user_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_submissions_type_idx" ON "user_submissions" USING btree ("submission_type");--> statement-breakpoint
CREATE INDEX "user_submissions_created_at_idx" ON "user_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_slug_idx" ON "videos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "videos_published_at_idx" ON "videos" USING btree ("published_at");