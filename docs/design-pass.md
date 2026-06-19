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

| # | Route | Page | Status | Notes |
|---|-------|------|--------|-------|
| 1 | `/` | Home | ⬜ | thin shell; many commented placeholders (Staff Picks, Fan Favorites, Recent Shorts) — pilot page |
| 2 | `/shows` | Shows index | ⬜ | |
| 3 | `/show/[show_number]/[slug]` | Show detail | ✅ | video Post frame matched: sidebar (swag/most-popular/trending), subscribe row, red YouTube CTA in title (top-right), relative date, canonical tags under title, prev/next, capped Most-Popular(5). Open: backfill content_tags on #950+ (tag row empty on recent shows); audio-only play UI is deferred (commented scaffolding kept on purpose, not dead code) |
| 4 | `/show/[show_number]/[slug]/transcript` | Transcript | ⬜ | |
| 5 | `/shows/syntax-podcast` | Podcast landing | ⬜ | |
| 6 | `/guests` | Guests index | ⬜ | |
| 7 | `/guest/[name_slug]` | Guest detail | ⬜ | |
| 8 | `/snackpack` | Snackpack index | ⬜ | |
| 9 | `/snackpack/[issue_id]` | Snackpack issue | ⬜ | |
| 10 | `/sickpicks` | Sick picks | ⬜ | |
| 11 | `/potluck` | Potluck | ⬜ | |
| 12 | `/about` | About | ⬜ | |
| 13 | `/oss` | Open source | ⬜ | |
| 14 | `/pages/[page]` | CMS pages | ⬜ | template chrome only; body is CMS content |
| 15 | `/login` | Login | ⬜ | |
| 16 | `/spooky` | Spooky | ⏭️ | seasonal — low priority |
| — | `/X_videos/**` | Videos (old) | ⏭️ | out of scope — migration leftovers, kept around temporarily |

## Admin pages (phase 2 — after public)

21 routes under `/admin/**`. Note: admin keeps Save buttons (exempt from no-Save rule).
