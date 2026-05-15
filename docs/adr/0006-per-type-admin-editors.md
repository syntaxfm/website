# ADR-0006 — Per-type admin editors are canonical; `/admin/content/[id]` removed

## Status

Accepted. Supersedes the "New admin UI" rule in [ADR-0004](./0004-unified-content-model.md).

## Decision

Each content type has its own deep editor under `/admin/content/{type}/[id]`:

- `/admin/content/podcast/[show_number]`
- `/admin/content/articles/[content_id]`
- `/admin/content/videos/[content_id]`
- (future per-type editors as new content types are built)

The generic `/admin/content/[content_id]` editor is removed. `/admin/content` remains as the cross-type list view with filters, bulk actions, and "Edit" links that route to the appropriate per-type editor.

## Why

ADR-0004 envisioned a generic content editor with type-specific overlays. In practice each content type has substantial unique UI — Shows have guests, hosts, videos, transcripts, and AI artifacts; Articles have a markdown body and author; Videos are YouTube-source-of-truth and largely read-only. A generic editor with per-type overlays grew toward being a switch statement that rendered fundamentally different forms, with no real shared logic above the field-component layer.

Splitting by type:

- Lets each editor be authored against its actual schema without defensive checks for "what type am I editing today."
- Keeps cross-cutting concerns (slug uniqueness, status, `published_at`, tags) on `content` where ADR-0004 put them — the per-type editor's command writes to both the per-type table and `content` (e.g. `update_show_editor` already does this).
- Makes new content types a tractable "add a new route" rather than "add a new branch to the generic form."

## What from ADR-0004 still stands

- The `content` table remains the canonical wrapper. Slug uniqueness, status, `published_at`, and tagging continue to live on `content`.
- Cross-cutting fields (future SEO meta, scheduling, related-content links) still belong on `content`, not on per-type tables.
- `/admin/content` continues to be the cross-type editorial list view.

## What changes from ADR-0004

- The rule "New admin UI: live under `/admin/content/*` and operate on `content`-shaped data" is replaced with: new admin UI lives under `/admin/content/{type}/*` and operates on the per-type entity, which is responsible for keeping `content` in sync.
- `/admin/content/[content_id]` is removed. Article editing moves from `/admin/content/[content_id]/article` to `/admin/content/articles/[content_id]`.

## Trade-offs

- New content types need their own admin route — no zero-cost shell.
- More files; less code duplication in practice because each editor is tighter against its real schema.
- Future contributors must read ADR-0004 + ADR-0006 together — neither is complete alone.
