# Design pass — page-by-page Figma cleanup

Goal: every public page matches its Figma frame, **component by component**, using the
existing `src/styles/` token system and the responsive patterns already in the components.
Public pages first, then admin.

## The rule that keeps it flexible (read first)

Figma is desktop-only at large spacing. We treat Figma as the source of **intent**
(hierarchy, proportion, which component goes where, type-scale relationships) — **not**
literal pixels. Translate every value into the existing system:

| Figma gives us        | We write                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| A color               | `var(--c-*)` token (`--c-bg`, `--c-fg`, `--c-primary`, `--c-yellow`, …)   |
| A font size           | `var(--fs-*)` scale or `.h*` / `.fs-*` class; fluid `clamp()` if siblings do |
| A desktop spacing/size| The **default / top of a `clamp()`**, then step down via `@media (--below-med)` or container queries — mirror how the sibling components already do it |
| A radius / border     | `var(--br-*)`, `var(--border-size)`                                       |
| A breakpoint          | `@custom-media` tokens: `--below-small/med/large/xlarge`                  |

Only introduce a new token/class if no equivalent exists in `src/styles/` — and note the
one-line justification in the PR/commit (per repo CSS rules).

## Per-page loop

1. **Pull Figma** — get the frame(s) for the page via the Figma MCP (selected frame or link).
2. **Capture current** — run locally, screenshot the live page (desktop + mobile widths) via chrome-devtools.
3. **Diff** — list what's missing, misaligned, placeholdered, or dead.
4. **Component by component** — for each component on the page, match Figma using the token
   table above; extend existing responsive patterns rather than hardcoding desktop values.
5. **Clean** — delete commented-out placeholders, dead sections, unused imports.
6. **Verify** — desktop + mobile + dark/light; no console errors.
7. **Mark status** below.

Status: ⬜ todo · 🟨 in progress · ✅ done · ⏭️ deferred

## Public pages (impact order)

Statuses checked page by page with Scott on 2026-11-05. Open work is tracked in Dex
under the epic `iw15n6bh` (Public site design pass); the Dex task is in the last column.

| # | Route | Page | Status | Notes | Dex |
|---|-------|------|--------|-------|-----|
| 1 | `/` | Home | ⬜ | Needs a full evaluation against the ✅ HOME frame: no splashy header, commented-out sections (Staff Picks, Fan Favorites, Recent Shorts, Guests, 3D Sk8). The feed (`src/lib/feed/`) is shared with Guest pages | `408npbn0` |
| 2 | `/shows` | Shows index | ✅ | Episode grid, reuses ShowEpisodes/Pagination. Filter chips + search from the Figma frame are deferred | |
| 3 | `/show/[show_number]/[slug]` | Show detail | 🟨 | Video post frame matched. Open: audio-only play UI (commented scaffolding in `PodcastPost.svelte`) and content_tags backfill on #950+ | `qdeszsr7` |
| 4 | `/show/[show_number]/[slug]/transcript` | Transcript | ⬜ | Not close. Redesign from scratch; no Figma frame | `tlvb9k5k` |
| 5 | `/shows/syntax-podcast` | Podcast landing | ✅ | 301 redirect to `/shows` (keeps `?page`/`?perPage`) | |
| 6 | `/guests` | Guests index | ✅ | Search, A–Z/Recent/Jumble, photo cards | |
| 7 | `/guest/[name_slug]` | Guest detail | ✅ | Page done; waits only on the shared feed (Home) | `408npbn0` |
| 8 | `/snackpack` | Snackpack index | ✅ | Matches LIST \| Newsletter. The archive's uncached Kit crawl (~2–3 s) is part of the site-wide perf pass | `xdtusmbh` |
| 9 | `/snackpack/[issue_id]` | Snackpack issue | ✅ | | |
| 10 | `/sickpicks` | Sick picks | ⬜ | Not close. Needs a design first (no ✅ frame) and paging (1,717 links) | `glyultqh` |
| 11 | `/potluck` | Potluck | ✅ | | |
| 12 | `/about` | About | 🟨 | Rebuilt to the ✅ LIST \| About Us (Team) frame, with Niki (no Chad). Faces cut from the headshots by `scripts/face_cutout.swift`. Waiting on Scott's review | `v1plttsx` |
| 13 | `/oss` | Open source | ⏭️ | Not needed. Archive it, redirect to episode 894 | `k9t6g4y5` |
| 14 | `/pages/[page]` | CMS pages | ⬜ | Privacy, Terms, Giveaway rules. Fix through the default element CSS, not route styles | `1m5z73wn` |
| 15 | `/login` | Login | ✅ | Central Syntax Auth | |
| 16 | `/spooky` | Spooky | ✅ | | |
| — | `/X_videos/**` | Videos (old) | ✅ | Retired 2026-06-19 — routes deleted, orphaned PlaylistCard/PlaylistVideo removed, dead `/videos` links pulled from sitemap + PodcastPost "Related Videos". `lib/videos/utils.ts` kept (used by Show/feed). | |
| — | all pages | Performance | ⬜ | Site-wide: Home 768 KB HTML, guest 1.84 MB, 100 feed items, no lazy images | `xdtusmbh` |

## Admin pages (phase 2 — after public)

21 routes under `/admin/**`. Note: admin keeps Save buttons (exempt from no-Save rule).

Started 2026-11-24. Fix shared pieces in `src/styles/admin.css` and `src/lib/admin/` first, so
one fix cleans every page that uses them. Admin content sits on a solid sheet (`.admin`) over the
speckle texture.

Every list page is built from the same pieces in `src/lib/admin/`, so a fix there reaches all
of them. Pages never hand-write these:

- `AdminList`: lays the filters out in one row, adds `× Clear` (`clear_href`), shows the count,
  pager and action messages (`message`/`error`), and draws the checkbox column when a `bulk`
  snippet is given (`select_cell` for each row). Selecting turns the count row into the sticky
  bulk bar at the same height, so the table never moves.
- `AdminSearch` (live), `AdminDateRange`, `AdminFilterMenu` (with `to_filter_options`)
- `AdminTitleCell` (editor link, public-page icon, optional thumbnail and muted detail line),
  `AdminDateCell`
- `content_links.ts`: where a Content item is edited and where it lives in public
- `AdminTable`: the bare table (head, rows, empty row). `AdminList` uses it; so do the dashboard panels
- Row CSS: `.admin-cell-number`, `.admin-cell-actions` (compact, Delete muted until row hover),
  fields in cells read as text until hovered, `.admin-inline-form` for one-line create forms

`SelectMenu` styles live in `@layer components` so admin.css can restyle them; the layer order is
declared in `app.html`.

| # | Route | Page | Status | Notes |
|---|-------|------|--------|-------|
| — | all | Admin menu (`AdminMenu.svelte`) | ⬜ | Overflows at phone width |
| 1 | `/admin/content` | Content list | 🟨 | On the shared list pieces. Waiting on Scott's review |
| 2 | `/admin/content/podcast` | Podcast list | 🟨 | On the shared list pieces; action buttons above still need a look |
| 3 | `/admin/content/podcast/[show_number]` | Podcast editor | ⬜ | |
| 4 | `/admin/content/podcast/new` | New podcast | ⬜ | |
| 5 | `/admin/content/podcast/transcripts` | Transcripts | ⬜ | |
| 6 | `/admin/content/videos` | Video list | ⬜ | |
| 7 | `/admin/content/videos/[content_id]` | Video editor | ⬜ | |
| 8 | `/admin/content/articles` | Article list | ⬜ | |
| 9 | `/admin/content/articles/[content_id]` | Article editor | ⬜ | |
| 10 | `/admin` | Dashboard | 🟨 | Number tiles, panels on `AdminTable`, long panels show 8 rows + Show all. Waiting on Scott's review |
| 11 | `/admin/submissions` | Submissions | 🟨 | Compact in-row status + Close; message preview fixed. Waiting on Scott's review |
| 12 | `/admin/tags` | Tags | 🟨 | Names/descriptions edit in place, Save only when changed, quiet Delete. Waiting on Scott's review |
| 13 | `/admin/tags/[id]` | Tag editor | ⬜ | |
| 14 | `/admin/guests` | Guests | ⬜ | Create row sits above search; 44px vs 40px controls |
| 15 | `/admin/guests/[id]` | Guest editor | ⬜ | |
| 16 | `/admin/seo` | SEO tracker | ⬜ | |
| 17 | `/admin/users` | Users | ⬜ | |
| 18 | `/admin/users/[user_id]` | User editor | ⬜ | |
| 19 | `/admin/users/roles` | Roles | ⬜ | |
