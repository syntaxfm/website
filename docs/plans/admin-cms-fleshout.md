# Plan — Flesh out `/admin` into a CMS-grade editorial experience

This plan was produced in a grill-with-docs session on 2026-05-15. It is intended to be picked up by a fresh-context agent. Read every section before writing code. The architectural choices in this plan were the result of explicit user decisions; do not relitigate them.

---

## 1. Mission

Bring `/admin` to editorial-first parity: every entity that ships content (Shows, Articles, Videos, Guests, Hosts, Tags, Submissions, AI artifacts, Playlists) is fully editable through a consistent admin UI. NEWSLETTER / TOOL / EVENT content types are explicitly deferred.

The work spans six phases. Earlier phases unblock later ones.

---

## 2. Required reading (in this order, before any code)

1. [`AGENTS.md`](../../AGENTS.md) — repo-wide agent rules. Pay special attention to: tabs not spaces, single quotes, snake_case identifiers (ADR-0005), no `any`, no `$effect` unless required, components own their data, no save buttons globally **— EXCEPTION: see §3 below**.
2. [`docs/CONTEXT.md`](../CONTEXT.md) — domain glossary. The AI lifecycle and the `/admin/content/podcast` URL-vs-Show asymmetry were captured here on 2026-05-15; both are load-bearing for this work.
3. [`docs/adr/0004-unified-content-model.md`](../adr/0004-unified-content-model.md) — what `content` is for, what stays on per-type tables.
4. [`docs/adr/0006-per-type-admin-editors.md`](../adr/0006-per-type-admin-editors.md) — the decision that shapes every editor URL in this plan. **Supersedes part of ADR-0004**; read both.
5. `src/server/db/schema.ts` — every table you'll touch is here. Names in the schema win over names in code if there's a conflict.

---

## 3. Project-specific overrides

The user's global CLAUDE.md has rules that **do not apply** to this project. Specifically:

- **Save buttons stay.** The global "no save buttons; auto-save on data change" rule is overridden here. Admin editors keep explicit Save buttons. Design new editors with an explicit commit gesture.
- **No refresh buttons.** The global rule applies. Lists must always show fresh data via re-query on filter change or post-mutation. Side-effectful external syncs (Sync Spotify, Import YouTube, RSS pull) are *not* refresh buttons and stay.

If the user changes their mind on either, they will tell you. Do not assume.

---

## 4. Critical context — decisions already made

These are not open questions. Do not re-grill on them.

| Topic | Decision |
| --- | --- |
| Editor canonicality | Per-type editors under `/admin/content/{type}/[id]` are canonical. `/admin/content/[content_id]` is removed entirely. |
| `/admin/content` page | Stays as a cross-type list with filters, bulk actions, and pagination. "Edit" links route to per-type editor URLs. |
| Article URL change | `/admin/content/[content_id]/article` → `/admin/content/articles/[content_id]`. `/admin/articles` list moves to `/admin/content/articles`. |
| Video editor | New, at `/admin/content/videos/[content_id]`. YouTube is the source of truth — metadata fields are read-only / import-driven. Tags + content meta are editable. |
| Playlists path | Move `/admin/content/videos/[playlist_id]` → `/admin/content/videos/playlists/[id]`. Add `/admin/content/videos/playlists` list. |
| Podcast/Show URL | Stays as `/admin/content/podcast`. The URL segment matches the `content_types` enum value `PODCAST`. Page H1/nav label remains "Shows." Documented in CONTEXT.md. |
| AI artifacts | View + inline edit, no approval gate. "Regenerate" is destructive with a confirm prompt that warns about manual-edit loss. No new status column. |
| Editorial fields on `content` | Excerpt / hero / SEO meta: **out of scope.** Do not add columns. |
| Permissions | Binary admin role only. `assert_admin_user()` stays as-is on every command. |
| Commented podcast columns + temp migration command | Out of scope. Leave alone. |
| NEWSLETTER / TOOL / EVENT | Out of scope. No per-type editors yet. Enum values stay. |
| Image / media upload | Out of scope. Hero image URL strings only if/when ever added — not in this pass. |

---

## 5. Existing patterns to mirror

Read these files; copy their shape; don't invent new patterns.

| Concern | Reference file | Notes |
| --- | --- | --- |
| List page with filters + bulk + pagination | `src/routes/(site)/admin/content/+page.svelte` and `admin_content.remote.ts` | The reference implementation. Everything else gets normalized to match. |
| Per-type deep editor with tags/relations | `src/routes/(site)/admin/content/podcast/[show_number]/+page.svelte` and `admin_podcast.remote.ts` | Shows the search-and-attach pattern (guests, videos) and the tag diffing approach. |
| Form field components | `src/lib/admin/SlugEditor.svelte`, `StatusSelect.svelte`, `DateTimePicker.svelte`, `MultiSelect.svelte`, `MarkdownEditor.svelte` | Reuse, don't duplicate. |
| Admin-only command validation | Any `admin_*.remote.ts` | Uses Valibot. Always `assert_admin_user()` first. |
| Search-and-attach sub-form (relation picker) | The Guests / Videos sections inside the show editor | Same pattern for Hosts panel, guest social links, etc. |
| AdminSearch + AdminActions | `src/routes/(site)/admin/AdminSearch.svelte`, `AdminActions.svelte` | Tiny chrome components; existing list pages use them inconsistently — normalize during Phase 3. |

---

## 6. Phases

Phases are sequential — earlier phases unblock later ones. Run typecheck (`pnpm check`) and lint (`pnpm lint`) after each phase before moving on. Smoke-test the affected admin pages in the browser before declaring a phase done (per CLAUDE.md UI rules).

### Phase 1 — Foundation (shared list primitive + URL-param helpers)

**Goal**: get a reusable `<AdminList>` primitive and URL-param helpers in place so subsequent phases plug in cleanly.

Tasks:

1. Create `src/lib/admin/AdminList.svelte`:
   - Slots / snippets for: filter toolbar, bulk action panel (rendered only when selection > 0), table head, table body, pagination footer.
   - Props: `total`, `page`, `page_size`, `total_pages`, callbacks for `on_page_change`.
   - Built-in: pagination controls, "N selected" counter, select-all-visible checkbox wiring.
   - Selection state is owned by the parent (so it can be cleared post-mutation).
2. Create `src/lib/admin/admin_filters.ts`:
   - Helper to read filter / sort / page state from `$page.url.searchParams` with typed picklist coercion.
   - Helper to build a URL with updated params (preserving the rest).
   - Helper to detect "any filter active" → controls visibility of the `× Clear` link.
3. Update `src/routes/(site)/admin/AdminMenu.svelte`:
   - Add `Guests` top-level entry.
   - Rename Content > Articles path: `/admin/articles` → `/admin/content/articles`.
   - Add Content > Video > Playlists entry under videos.
   - Keep label "Shows" for `/admin/content/podcast`.

**Validation**: `pnpm check` + `pnpm lint` clean. Visit `/admin/content` and confirm it still renders with the new primitive (Phase 3 will swap in the primitive — for Phase 1 just make sure the primitive type-checks against the content list's shape).

### Phase 2 — Per-type URL normalization

**Goal**: get the URL plan from ADR-0006 in place. No new entity surfaces yet.

Tasks:

1. **Articles**:
   - Move `src/routes/(site)/admin/content/[content_id]/article/+page.svelte` → `src/routes/(site)/admin/content/articles/[content_id]/+page.svelte`.
   - Move `src/routes/(site)/admin/articles/+page.svelte` → `src/routes/(site)/admin/content/articles/+page.svelte`.
   - Move `src/routes/(site)/admin/articles/admin_articles.remote.ts` → `src/routes/(site)/admin/content/articles/admin_articles.remote.ts`.
   - Update every import path that referenced the old locations (run `pnpm exec grep -r "admin/articles" src/`).
   - Update `to_edit_link` in `admin_content.remote.ts` callers (it lives in `src/routes/(site)/admin/content/+page.svelte` around line 280) to point at the new article URL.
2. **Videos**:
   - Create `src/routes/(site)/admin/content/videos/[content_id]/+page.svelte` and `admin_videos.remote.ts` (a real per-type editor — see Phase 4 for content; for Phase 2 just stub the route so it renders the meta fields + tags).
   - Move existing `src/routes/(site)/admin/content/videos/[playlist_id]/+page.svelte` → `src/routes/(site)/admin/content/videos/playlists/[id]/+page.svelte`.
   - Create `src/routes/(site)/admin/content/videos/playlists/+page.svelte` and `admin_playlists.remote.ts` (list page — Phase 4 fills out CRUD; Phase 2 just stub the list with existing playlist data).
3. **Generic content editor removal**:
   - Delete `src/routes/(site)/admin/content/[content_id]/+page.svelte`.
   - Delete the now-empty `src/routes/(site)/admin/content/[content_id]/` directory.
   - Update `/admin/content/+page.svelte` `to_edit_link` so PODCAST routes to `/admin/content/podcast/{number}`, ARTICLE to `/admin/content/articles/{content_id}`, VIDEO to `/admin/content/videos/{content_id}`. (Most of this already exists; verify and finish.)

**Validation**: `pnpm check` + `pnpm lint`. Click every "Edit" link in `/admin/content` and confirm it lands on the correct per-type editor. Confirm `/admin/content/[id]` 404s (or routes elsewhere — but does *not* render the deleted editor).

### Phase 3 — List page normalization

**Goal**: every list page uses `<AdminList>` with URL-param filter state, server-paginated queries, and bulk actions where editorially meaningful.

Apply the pattern to:

- `/admin/content` — already mostly there; refactor to use the new `<AdminList>` primitive and `admin_filters` helpers.
- `/admin/content/podcast` — add status/date filters, pagination, optional bulk (status update, attach tags). Today loads up to 500 shows.
- `/admin/content/articles` — same. Today loads all.
- `/admin/content/videos` — same.
- `/admin/guests` — new (Phase 4 creates the data layer; Phase 3 wires the list pattern to it).
- `/admin/users` — add bulk role assign / remove (paginate even though counts are low).
- `/admin/tags` — keep edit-in-row; standardize search and add pagination.
- `/admin/submissions` — already uses URL params; bring chrome under `<AdminList>` and add real pagination beyond `perPage`.

For each list page, the bulk action set should be the minimum that's editorially useful — don't add bulk operations just because the primitive supports them.

**Validation**: every list page renders. Filter state persists across reload. Bulk actions work. Pagination works. Empty states render. `pnpm check` + `pnpm lint`.

### Phase 4 — Missing entities

**Goal**: fill the entity gaps so every editorial table has an admin surface.

#### 4a. Guests

Tables involved: `guest`, `socialLink`. See `src/server/db/schema.ts:178` and `:226`.

- Create `src/routes/(site)/admin/guests/admin_guests.remote.ts`:
  - `list_guests` (paginated, search by name).
  - `get_guest_detail` (with social links).
  - `create_guest` (name, generates `name_slug` via `speakingurl` like other slug fields).
  - `update_guest` (name, name_slug, twitter, github, url, "of").
  - `delete_guest` (cascades to socialLink + showGuest via FK).
  - `add_social_link`, `remove_social_link`.
- Create `src/routes/(site)/admin/guests/+page.svelte` (list page using `<AdminList>`).
- Create `src/routes/(site)/admin/guests/[id]/+page.svelte` (editor with social links as a search-and-attach-style sub-form — adapt the show-editor video sub-form pattern).
- Add `Guests` entry to `AdminMenu` (already prepped in Phase 1).

#### 4b. Hosts on a Show

Table involved: `showToUser` (the `show_to_user` join). See `src/server/db/schema.ts:157`.

- Extend `admin_podcast.remote.ts`:
  - `search_users_for_host` (lists Users — there's no role filter today since all users are admins; just return all users).
  - `add_show_host`, `remove_show_host` (write `showToUser`).
- Add a Hosts panel to `src/routes/(site)/admin/content/podcast/[show_number]/+page.svelte` directly below the Guests section. Same search-and-attach UI shape as the Guests/Videos sections in that file.
- Update `get_show_editor` to include `hosts: { with: { user: true } }` in the relation query.

#### 4c. AI artifact panels

Tables involved: `aiShowNote`, `aiSummaryEntry`, `aiTweet`, `link`, `aiGuest`, `topic`. See `src/server/db/schema.ts:312–391`.

- Extend `admin_podcast.remote.ts`:
  - `update_ai_show_note` (title, description).
  - `update_ai_summary_entry` (time, text, description).
  - `update_ai_tweet` (content).
  - `update_link` (name, url, timestamp).
  - `update_ai_guest` (name).
  - `update_topic` (name).
  - Per-row delete commands: `delete_ai_summary_entry`, `delete_ai_tweet`, `delete_link`, `delete_ai_guest`, `delete_topic`.
  - **Re-use** `fetch_AI_notes` (already exists at line 516 of `admin_podcast.remote.ts`) for regeneration — it already deletes and recreates. Verify it cascades correctly.
- Add AI panels to the show editor at `src/routes/(site)/admin/content/podcast/[show_number]/+page.svelte`:
  - Five expandable sections: Summary entries, Tweets, Links, Guests (AI-detected), Topics.
  - Each section: list of editable rows (using a small inline-row component), "Add row" affordance if practical, "Delete row" per item.
  - Top of the AI section: "Regenerate AI notes" button. Confirms with text like "This will delete every AI artifact for this Show including any manual edits. Continue?" before calling `fetch_AI_notes`.
  - If no transcript exists, hide all AI panels and show one line: "Transcript required to generate AI notes."

#### 4d. Playlists CRUD

Tables involved: `playlist`, `playlistOnVideo`. See `src/server/db/schema.ts:416` onward.

- `admin_playlists.remote.ts` (created in Phase 2): fill out `list_playlists`, `get_playlist_detail`, `create_playlist`, `update_playlist`, `delete_playlist`, `add_video_to_playlist`, `remove_video_from_playlist`.
- Playlist editor at `/admin/content/videos/playlists/[id]` gets a search-and-attach panel for videos.

**Validation**: smoke-test each new editor end-to-end in the browser. Create / edit / delete a guest. Add a host. Inline-edit an AI summary entry. Regenerate AI notes for a show with manual edits and confirm the prompt fires. `pnpm check` + `pnpm lint`.

### Phase 5 — Dashboard rework

Rewrite `src/routes/(site)/admin/+page.server.ts` and `+page.svelte`. Sections (each linked to the corresponding filtered list page):

1. Top strip — three pill counts: pending submissions, drafts (`content` rows where status=DRAFT), scheduled (status=PUBLISHED + `published_at` > now). Each pill is a link.
2. Next shows — three upcoming shows (replaces the current Next 9).
3. Shows missing transcript (last 30d) — for each row, an inline button to call `fetch_show_transcript` (already exists).
4. Shows missing AI notes (last 30d) — same pattern, calls `fetch_AI_notes`.
5. Recently published (7d) — last 10 content rows where `published_at` is within 7 days.

Use indexed queries on `content_type_status_idx`, `content_type_published_idx`. No need to invent new indexes.

**Validation**: each section renders. Each link routes to a list page with filters pre-applied. Buttons trigger their server actions and update on success.

### Phase 6 — Documentation pass

- Re-read `docs/CONTEXT.md` and verify the AI lifecycle entry still matches what was built.
- If any new domain term emerged (it shouldn't — every table in this work is already in the glossary), add it.
- Update `docs/adr/README.md` if any new ADR-worthy decision arose during implementation. None is expected.

---

## 7. Out of scope reminders

Even when tempted, do not:

- Add `excerpt`, `hero_image_url`, `seo_*` columns to `content`.
- Add per-type editors for NEWSLETTER, TOOL, or EVENT.
- Touch the legacy `x-*` MySQL access path in `src/server/db/`.
- Add auto-save anywhere.
- Add image/media upload infra.
- Introduce finer permission roles.
- Restore the commented-out transcript/AI columns on the podcast list (lines 87–119 of `src/routes/(site)/admin/content/podcast/+page.svelte`).
- Delete `populate_content_from_existing_data` in `admin_content.remote.ts`.
- Re-litigate per-type editors vs generic content editor (ADR-0006).

If you find a real need to deviate, surface it to the user before doing it — do not silently expand scope.

---

## 8. Per-phase checklist (for handoff turn-by-turn)

```
[ ] Phase 1 — Foundation
    [ ] AdminList.svelte
    [ ] admin_filters.ts
    [ ] AdminMenu updates
    [ ] pnpm check + lint clean
    [ ] /admin still renders

[ ] Phase 2 — URL normalization
    [ ] Articles relocated
    [ ] Videos editor + playlists structure
    [ ] /admin/content/[content_id] deleted
    [ ] Edit links updated
    [ ] pnpm check + lint clean

[ ] Phase 3 — List page normalization
    [ ] /admin/content
    [ ] /admin/content/podcast
    [ ] /admin/content/articles
    [ ] /admin/content/videos
    [ ] /admin/users
    [ ] /admin/tags
    [ ] /admin/submissions
    [ ] pnpm check + lint clean

[ ] Phase 4 — Missing entities
    [ ] Guests list + editor + social links
    [ ] Hosts panel on show editor
    [ ] AI artifact panels
    [ ] Playlists CRUD
    [ ] pnpm check + lint clean

[ ] Phase 5 — Dashboard
    [ ] Queue sections wired
    [ ] Inline transcript/AI fetch actions
    [ ] pnpm check + lint clean

[ ] Phase 6 — Docs pass
    [ ] CONTEXT.md final pass
```

---

## 9. Open questions the implementing agent may surface

These are not blockers, but if they come up during implementation they should be flagged to the user before proceeding:

1. Does the `/admin/content/videos` list need actions beyond view-only? (User said videos are YouTube-source-of-truth.)
2. Should host removal warn that a host has authored shows? (Probably no — show records aren't affected by removing a Host from `show_to_user`.)
3. Confirm `fetch_AI_notes` cascades correctly — verify aiShowNote children delete via FK before regeneration.
4. The "of" field on the `guest` table (job title at company) has no label convention — confirm the label with the user when building the guest editor form.
