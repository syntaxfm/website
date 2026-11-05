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
| 8 | `/snackpack` | Snackpack index | ✅ | Matches LIST \| Newsletter. Bug: going back from an issue takes ~2.8 s with no feedback (uncached Kit crawl) | `eb6cvbsd` |
| 9 | `/snackpack/[issue_id]` | Snackpack issue | ✅ | | |
| 10 | `/sickpicks` | Sick picks | ⬜ | Not close. Needs a design first (no ✅ frame) and paging (1,717 links) | `glyultqh` |
| 11 | `/potluck` | Potluck | ✅ | | |
| 12 | `/about` | About | ⬜ | Not close. Rebuild to the ✅ LIST \| About Us (Team) frame | `v1plttsx` |
| 13 | `/oss` | Open source | ⏭️ | Not needed. Archive it, redirect to episode 894 | `k9t6g4y5` |
| 14 | `/pages/[page]` | CMS pages | ⬜ | Privacy, Terms, Giveaway rules. Fix through the default element CSS, not route styles | `1m5z73wn` |
| 15 | `/login` | Login | ✅ | Central Syntax Auth | |
| 16 | `/spooky` | Spooky | ✅ | | |
| — | `/X_videos/**` | Videos (old) | ✅ | Retired 2026-06-19 — routes deleted, orphaned PlaylistCard/PlaylistVideo removed, dead `/videos` links pulled from sitemap + PodcastPost "Related Videos". `lib/videos/utils.ts` kept (used by Show/feed). | |
| — | all pages | Performance | ⬜ | Site-wide: Home 768 KB HTML, guest 1.84 MB, 100 feed items, no lazy images | `xdtusmbh` |

## Admin pages (phase 2 — after public)

21 routes under `/admin/**`. Note: admin keeps Save buttons (exempt from no-Save rule).
