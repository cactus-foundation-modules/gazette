-- ---------------------------------------------------------------------------
-- Post URL style
--
-- Lets an owner choose whether a post lives at /gazette/<slug> (the only
-- behaviour before this) or at /<slug>. Defaults to the old shape so an
-- existing site's links do not move underneath it on update.
--
-- Idempotent: 001_initial.sql carries the same column for fresh installs, so
-- this file must be harmless when it has already been applied there.
-- ---------------------------------------------------------------------------
ALTER TABLE "gz_settings"
    ADD COLUMN IF NOT EXISTS "post_url_style" TEXT NOT NULL DEFAULT 'PREFIXED';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "pg_constraint" WHERE "conname" = 'gz_settings_post_url_style_check'
    ) THEN
        ALTER TABLE "gz_settings"
            ADD CONSTRAINT "gz_settings_post_url_style_check"
            CHECK ("post_url_style" IN ('PREFIXED','ROOT'));
    END IF;
END $$;
