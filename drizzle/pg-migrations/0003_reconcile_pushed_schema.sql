-- Reconciles migration history with production. The content model (content, articles, tags,
-- content_tags), search_vector columns and related indexes were applied to production with
-- `drizzle-kit push`, so no earlier migration records them. This migration's snapshot captures
-- them; the SQL below is the only difference a live, post-0002 database still has.
ALTER TABLE "articles" RENAME CONSTRAINT "articles_author_id_users_id_fk" TO "articles_author_id_profiles_id_fk";
