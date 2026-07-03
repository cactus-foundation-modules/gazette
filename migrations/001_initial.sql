-- Gazette Module - Initial Migration
-- Table prefix: gz_
-- Applied once by the Cactus module migration runner during build.

-- ---------------------------------------------------------------------------
-- Series (created before posts because posts reference it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_series" (
    "id"          TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "title"       TEXT         NOT NULL,
    "slug"        TEXT         NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_series_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_series_slug_unique" UNIQUE ("slug")
);

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_posts" (
    "id"                       TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "title"                    TEXT         NOT NULL,
    "slug"                     TEXT         NOT NULL,
    "excerpt"                  TEXT,
    -- 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
    "status"                   TEXT         NOT NULL DEFAULT 'DRAFT',
    "published_at"             TIMESTAMP(3),
    "scheduled_for"            TIMESTAMP(3),
    -- Media.id; no FK (mirrors InfoPage.ogImageId - render falls back gracefully)
    "featured_image_id"        TEXT,
    -- Posts survive author deletion
    "author_id"                TEXT,
    -- Display-string fallback for imported posts whose author has no User account
    "imported_author_name"     TEXT,
    "seo_title"                TEXT,
    "seo_description"          TEXT,
    "canonical_url"            TEXT,
    -- Puck Data JSON ({ root, content, zones }) built from the gazette body palette
    "builder_data"             JSONB,
    "is_pinned"                BOOLEAN      NOT NULL DEFAULT false,
    "is_private"               BOOLEAN      NOT NULL DEFAULT false,
    "view_count"               INTEGER      NOT NULL DEFAULT 0,
    "series_id"                TEXT,
    "series_order"             INTEGER,
    -- sha256(token + SESSION_SECRET); regenerating overwrites (invalidates old link)
    "preview_token_hash"       TEXT,
    "preview_token_expires_at" TIMESTAMP(3),
    "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_posts_slug_unique" UNIQUE ("slug"),
    CONSTRAINT "gz_posts_status_check" CHECK ("status" IN ('DRAFT','PUBLISHED','SCHEDULED')),
    CONSTRAINT "gz_posts_author_fk" FOREIGN KEY ("author_id") REFERENCES "User" ("id") ON DELETE SET NULL,
    CONSTRAINT "gz_posts_series_fk" FOREIGN KEY ("series_id") REFERENCES "gz_series" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "gz_posts_status_published_at_idx" ON "gz_posts" ("status", "published_at" DESC);
CREATE INDEX IF NOT EXISTS "gz_posts_scheduled_for_idx"       ON "gz_posts" ("scheduled_for");
CREATE INDEX IF NOT EXISTS "gz_posts_author_idx"              ON "gz_posts" ("author_id");
CREATE INDEX IF NOT EXISTS "gz_posts_series_idx"              ON "gz_posts" ("series_id", "series_order");
CREATE INDEX IF NOT EXISTS "gz_posts_pinned_idx"              ON "gz_posts" ("is_pinned") WHERE "is_pinned" = true;
CREATE INDEX IF NOT EXISTS "gz_posts_preview_token_idx"       ON "gz_posts" ("preview_token_hash");

-- ---------------------------------------------------------------------------
-- Tags + join table (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_tags" (
    "id"         TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "name"       TEXT         NOT NULL,
    "slug"       TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_tags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_tags_slug_unique" UNIQUE ("slug")
);

CREATE TABLE IF NOT EXISTS "gz_post_tags" (
    "post_id" TEXT NOT NULL,
    "tag_id"  TEXT NOT NULL,
    CONSTRAINT "gz_post_tags_pkey" PRIMARY KEY ("post_id", "tag_id"),
    CONSTRAINT "gz_post_tags_post_fk" FOREIGN KEY ("post_id") REFERENCES "gz_posts" ("id") ON DELETE CASCADE,
    CONSTRAINT "gz_post_tags_tag_fk"  FOREIGN KEY ("tag_id")  REFERENCES "gz_tags" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "gz_post_tags_tag_idx" ON "gz_post_tags" ("tag_id");

-- ---------------------------------------------------------------------------
-- Author profiles (deleted with the user - profile is personal data)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_author_profiles" (
    "id"         TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id"    TEXT         NOT NULL,
    -- Markdown, rendered with core markdownToHtml
    "bio"        TEXT,
    "avatar_id"  TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_author_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_author_profiles_user_unique" UNIQUE ("user_id"),
    CONSTRAINT "gz_author_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Comments (one level of replies enforced in app logic; cascade with post)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_comments" (
    "id"             TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "post_id"        TEXT         NOT NULL,
    "parent_id"      TEXT,
    "author_name"    TEXT         NOT NULL,
    "author_email"   TEXT         NOT NULL,
    -- Set when a logged-in admin/editor replies from the Comments screen
    "author_user_id" TEXT,
    "body"           TEXT         NOT NULL,
    -- 'PENDING' | 'APPROVED' | 'REJECTED'
    "status"         TEXT         NOT NULL DEFAULT 'PENDING',
    "ip_address"     TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_comments_status_check" CHECK ("status" IN ('PENDING','APPROVED','REJECTED')),
    CONSTRAINT "gz_comments_post_fk"   FOREIGN KEY ("post_id")   REFERENCES "gz_posts" ("id") ON DELETE CASCADE,
    CONSTRAINT "gz_comments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "gz_comments" ("id") ON DELETE CASCADE,
    CONSTRAINT "gz_comments_user_fk"   FOREIGN KEY ("author_user_id") REFERENCES "User" ("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "gz_comments_post_idx"       ON "gz_comments" ("post_id", "status");
CREATE INDEX IF NOT EXISTS "gz_comments_status_idx"     ON "gz_comments" ("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "gz_comments_parent_idx"     ON "gz_comments" ("parent_id");
CREATE INDEX IF NOT EXISTS "gz_comments_ip_created_idx" ON "gz_comments" ("ip_address", "created_at");

-- ---------------------------------------------------------------------------
-- Reactions (cascade with post; unique per visitor+emoji)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_reactions" (
    "id"            TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "post_id"       TEXT         NOT NULL,
    "emoji"         TEXT         NOT NULL,
    "visitor_token" TEXT         NOT NULL,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_reactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_reactions_unique" UNIQUE ("post_id", "emoji", "visitor_token"),
    CONSTRAINT "gz_reactions_post_fk" FOREIGN KEY ("post_id") REFERENCES "gz_posts" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "gz_reactions_post_idx" ON "gz_reactions" ("post_id");

-- ---------------------------------------------------------------------------
-- Post views (dedupe by visitor token; cascade with post)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_post_views" (
    "id"            TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "post_id"       TEXT         NOT NULL,
    "visitor_token" TEXT         NOT NULL,
    "viewed_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_post_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_post_views_unique" UNIQUE ("post_id", "visitor_token"),
    CONSTRAINT "gz_post_views_post_fk" FOREIGN KEY ("post_id") REFERENCES "gz_posts" ("id") ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Settings (singleton row, seeded here)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_settings" (
    "id"                  TEXT         NOT NULL DEFAULT 'singleton',
    "posts_per_page"      INTEGER      NOT NULL DEFAULT 10,
    "rss_enabled"         BOOLEAN      NOT NULL DEFAULT true,
    "feed_title"          TEXT,
    "feed_description"    TEXT,
    "comments_enabled"    BOOLEAN      NOT NULL DEFAULT true,
    -- 'PUBLIC' | 'MEMBERS_ONLY'
    "comments_visibility" TEXT         NOT NULL DEFAULT 'PUBLIC',
    -- 'PRE' | 'POST'
    "comment_moderation"  TEXT         NOT NULL DEFAULT 'PRE',
    "comments_threaded"   BOOLEAN      NOT NULL DEFAULT true,
    "reactions_enabled"   BOOLEAN      NOT NULL DEFAULT true,
    -- null = default set defined in code (DEFAULT_REACTION_SET in lib/settings.ts)
    "reaction_set"        JSONB,
    "show_view_counts"    BOOLEAN      NOT NULL DEFAULT false,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gz_settings_singleton" CHECK ("id" = 'singleton'),
    CONSTRAINT "gz_settings_visibility_check" CHECK ("comments_visibility" IN ('PUBLIC','MEMBERS_ONLY')),
    CONSTRAINT "gz_settings_moderation_check" CHECK ("comment_moderation" IN ('PRE','POST'))
);
INSERT INTO "gz_settings" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- Gazette roles (one per user; removed with user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_user_roles" (
    "user_id"     TEXT         NOT NULL,
    -- 'GAZETTE_CONTRIBUTOR' | 'GAZETTE_AUTHOR' | 'GAZETTE_EDITOR'
    "role"        TEXT         NOT NULL,
    "assigned_by" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_user_roles_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "gz_user_roles_role_check" CHECK ("role" IN ('GAZETTE_CONTRIBUTOR','GAZETTE_AUTHOR','GAZETTE_EDITOR')),
    CONSTRAINT "gz_user_roles_user_fk" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Post templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "gz_post_templates" (
    "id"           TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "title"        TEXT         NOT NULL,
    "builder_data" JSONB,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gz_post_templates_pkey" PRIMARY KEY ("id")
);
