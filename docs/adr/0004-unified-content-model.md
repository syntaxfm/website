# ADR-0004 — Unified `content` model wraps all content types

## Status

Accepted, mid-implementation. v3 is the migration vehicle.

## Decision

A single `content` table — discriminated by the `content_types` enum (`PODCAST`, `ARTICLE`, `VIDEO`, `TOOL`, `NEWSLETTER`, `EVENT`) — is the canonical identity for any piece of content on the site. Type-specific tables (`show`, `article`, `video`, etc.) continue to hold type-specific fields, but the slug, status (`DRAFT` / `PUBLISHED` / `ARCHIVED`), title, timestamps, and tagging belong to `content`.

## Why

Before v3, every content type lived in its own table with its own duplicated slug-uniqueness logic, its own admin UI, its own status flags, and its own tag-association table. Adding a new content kind (newsletters, tools, events) meant duplicating that stack again. Cross-type queries — "show me the 20 most recent published items of any type" — were unions of unions.

A single `content` table:
- gives one place to enforce slug uniqueness across the whole site (`content_slug_idx`),
- gives one publish workflow (`content_status` + `published_at`),
- gives one tagging system (`content_tags`),
- makes "everything new on the site" a single indexed query (`content_type_published_idx`),
- makes the admin UI generic (`/admin/content/[content_id]`) with per-type overlays where needed.

## Trade-offs

- **Joins are unavoidable.** To render a Show page you fetch a `content` row and a `show` row. The query layer (`src/server/shows/`) wraps this.
- **Two writers per content kind.** When creating or updating a Show you write to both `content` and `show`. The admin remote functions are responsible for keeping them in sync.
- **Mid-migration ambiguity.** Older code paths still treat `show` as the canonical entity. New surfaces (`/admin/content/*`) treat `content` as canonical. Both work today; the canonical answer is "go through `content` for new work" — but old code is not yet renovated.

## Considered and rejected

- **STI (single-table inheritance):** putting all type-specific fields into `content` as nullable columns. Rejected — the table fans out, every type's fields collide, and Postgres-level type safety dies.
- **Polymorphic associations with type+id:** keep type-specific tables and put a `(content_type, content_id)` pair on every related table (tags, comments, etc.). Rejected — joins require runtime type dispatch, and Postgres can't enforce the foreign key.
- **Status quo:** keep per-type tables forever and duplicate any new cross-cutting concern. Rejected — that's exactly what made the codebase hard to extend.

## Rule

For new content-related work, treat `content` as the canonical entity:
- New content types: add to the `content_types` enum and (if needed) create a thin per-type table for type-specific fields, joined by `content.id`.
- New cross-cutting fields (SEO meta, related-content links, scheduling): add them to `content`, not to per-type tables.
- New admin UI: live under `/admin/content/*` and operate on `content`-shaped data.

For existing surfaces (shows page, article rendering): keep using the type-specific entry point until the migration of that surface is scheduled. Don't half-migrate a feature.
