ALTER TABLE "users" RENAME TO "profiles";--> statement-breakpoint
ALTER TABLE "profiles" RENAME CONSTRAINT "users_pkey" TO "profiles_pkey";--> statement-breakpoint
ALTER TABLE "profiles" RENAME CONSTRAINT "users_github_id_unique" TO "profiles_github_id_unique";--> statement-breakpoint
ALTER TABLE "profiles" RENAME CONSTRAINT "users_email_unique" TO "profiles_email_unique";--> statement-breakpoint
ALTER INDEX "users_email_idx" RENAME TO "profiles_email_idx";--> statement-breakpoint
ALTER INDEX "users_github_id_idx" RENAME TO "profiles_github_id_idx";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "central_user_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_central_user_id_unique" UNIQUE("central_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_central_user_id_idx" ON "profiles" USING btree ("central_user_id");--> statement-breakpoint

UPDATE "profiles"
SET "central_user_id" = 'y6F5Uj6nzxdMz4iEzbsAITVFDWgsDUhv'
WHERE "github_id" = 669383;--> statement-breakpoint

ALTER TABLE "user_roles" RENAME TO "profile_roles";--> statement-breakpoint
ALTER TABLE "profile_roles" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "profile_roles" RENAME CONSTRAINT "user_roles_pkey" TO "profile_roles_pkey";--> statement-breakpoint
ALTER TABLE "profile_roles" RENAME CONSTRAINT "user_roles_user_id_users_id_fk" TO "profile_roles_profile_id_profiles_id_fk";--> statement-breakpoint
ALTER TABLE "profile_roles" RENAME CONSTRAINT "user_roles_role_id_roles_id_fk" TO "profile_roles_role_id_roles_id_fk";--> statement-breakpoint
ALTER INDEX "user_roles_user_id_idx" RENAME TO "profile_roles_profile_id_idx";--> statement-breakpoint
ALTER INDEX "user_roles_role_id_idx" RENAME TO "profile_roles_role_id_idx";--> statement-breakpoint
ALTER INDEX "user_roles_user_role_idx" RENAME TO "profile_roles_profile_role_idx";--> statement-breakpoint

ALTER TABLE "show_to_user" RENAME TO "show_to_profile";--> statement-breakpoint
ALTER TABLE "show_to_profile" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "show_to_profile" RENAME CONSTRAINT "show_to_user_show_id_user_id_pk" TO "show_to_profile_show_id_profile_id_pk";--> statement-breakpoint
ALTER TABLE "show_to_profile" RENAME CONSTRAINT "show_to_user_show_id_shows_id_fk" TO "show_to_profile_show_id_shows_id_fk";--> statement-breakpoint
ALTER TABLE "show_to_profile" RENAME CONSTRAINT "show_to_user_user_id_users_id_fk" TO "show_to_profile_profile_id_profiles_id_fk";--> statement-breakpoint
ALTER INDEX "show_to_user_show_id_idx" RENAME TO "show_to_profile_show_id_idx";--> statement-breakpoint
ALTER INDEX "show_to_user_user_id_idx" RENAME TO "show_to_profile_profile_id_idx";--> statement-breakpoint

DROP TABLE "sessions";
