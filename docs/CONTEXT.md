# Syntax Podcast Website — Domain Glossary

The shared vocabulary for the codebase that runs [syntax.fm](https://syntax.fm). When a term here conflicts with the way you'd naturally describe something, this file is the source of truth — use the canonical word.

This is a glossary, not a spec. It captures only domain language that is ambiguous, overloaded, or specific to this project. General programming concepts do not belong here.

## Language

### Content

**Show**:
A single episode of the Syntax podcast. Rows in the `show` table. Component and route language matches: `ShowCard`, `/show/[show_number]/[slug]`, `src/lib/shows/`.
_Avoid_: Episode (in code/identifiers; use "Show"). Acceptable in user-facing copy where "episode" reads more naturally.

**Syntax**:
The podcast itself — the brand. There is only one. Distinct from a **Show**, which is one episode.
_Avoid_: "the show" when referring to Syntax (it conflicts with **Show** above)

**show_type**:
Historical classification of back-catalog episodes. Four values:
- **Hasty** (`HASTY`): short episode with both hosts (~15–25 min). Originally "Hasty Treat."
- **Tasty** (`TASTY`): longer episode with both hosts (~1 hr). Originally "Tasty Treat."
- **Supper Club** (`SUPPER`): episode with a guest interview.
- **Special** (`SPECIAL`): one-off (live show, anniversary, etc.).

**Important**: These labels apply to the back catalog only. The podcast now runs a Mon/Wed schedule with no strong format distinction between episodes; new shows don't necessarily fit these buckets. `src/utilities/format_show_type.ts` derives a display label from release day-of-week as a fallback when the column doesn't reflect modern reality.

**Article**:
A long-form written post, stored in the `article` table. Distinct from a **Show** and from **content** (see below).

**Content**:
The new unified wrapper entity for *all* content types — Shows, Articles, Videos, Tools, Newsletters, Events. Rows in the `content` table; type discriminated by the `content_types` enum (`PODCAST`, `ARTICLE`, `VIDEO`, `TOOL`, `NEWSLETTER`, `EVENT`).

**Status**: mid-migration. `show`, `article`, and per-type tables still exist and hold type-specific fields, but the canonical content identity is moving to `content`. New work that touches the content layer should go through `content` where possible. See [ADR-0004](./adr/0004-unified-content-model.md).

### People and roles

**User**:
An authenticated identity (GitHub OAuth). In current state, only admins log in — there are no public end-user accounts (no commenters, no subscribers as users). Wes Bos and Scott Tolinski log in as Users with admin roles.
_Avoid_: Account, member.

**Host**:
A **User** linked to a **Show** via the `show_to_user` join table. Not a separate entity — Host is a relationship, not a record. Drizzle relations expose this as `hosts: many(showToUser)`.

**Guest**:
A third-party who appears on a **Show** as an interviewee. Stored in the `guest` table; linked via `show_guest`. A Guest is **not** a User — guests have profiles and social links but no auth identity.

### AI-generated content

**aiShowNote**:
The parent AI-generated artifact for a **Show** — one row per show (unique on `show_number`). Holds the AI-written title and description of the episode. Owns child rows: `aiSummaryEntry`, `aiTweet`, `link`, `aiGuest`, `topic`.

**aiSummaryEntry**:
A timestamped summary segment within an `aiShowNote` (e.g. "01:23 — Topic introduction"). Many per show note.

**aiTweet**:
An AI-drafted promotional tweet about the **Show**. Many per show note.

**link**:
An AI-extracted link mentioned in the **Show**, with optional timestamp. Many per show note.

**aiGuest**:
An AI-detected guest *name* mentioned in the **Show**. Not the same as a **Guest** record — `aiGuest` is just a name string; a **Guest** is a curated profile. The two are deliberately separate.

**topic**:
An AI-detected topic mentioned in the **Show**. Many per show note. Not the same as a **Tag** — `topic` is an AI suggestion; a **Tag** is a curated taxonomy entry.

**Lifecycle**:
AI artifacts have no status column and no approval gate. They are generated wholesale from a transcript and may be edited inline in the show editor. **Regeneration replaces them wholesale** — manual edits are lost when "Regenerate AI notes" is invoked. The show editor must confirm before regenerating if any artifact rows exist. AI artifacts render publicly as-is once present; absence is not failure (the site falls back to the human-curated `show.show_notes`).

### Submissions

**UserSubmission**:
Audience-submitted Q&A-style content from public-facing forms — questions, topic suggestions, and nominations the audience wants the hosts to discuss on a Show. The "User" in the name refers to a site visitor (lowercase-u, audience member), **not** to a row in the `user` table. Confirmed in `src/server/db/schema.ts`: `user_submissions` has no `user_id` column and no FK to `user`, and `userSubmission` has no Drizzle relations defined. The row carries a self-reported `name` and `email` (both nullable `varchar`), so a submitter may identify themselves, but that identity never resolves to a **User** record. The naming collides with this codebase's capital-U **User** (an authenticated admin identity); read it as "submission from someone using the site."

A submission is **not** a curated Guest, Tool, Article, or any other entity — it's a piece of audience input that may inform what gets discussed on a Show. `submission_type` is the form it came from (`POTLUCK`, `SPOOKY`, `GUEST`, `FEEDBACK`, `OSS`, `OTHER`).

_Avoid_: treating a `submission_type=GUEST` row as a **Guest** record. The `GUEST` type means "audience-suggested guest pitch," not "Guest entity." There is no foreign key from `userSubmission` to `guest`.

Status flow: `PENDING → APPROVED → COMPLETED` or `REJECTED`. **COMPLETED** means "the question has been answered" (typically on a Show) — it's the filter that hides handled items. There is no enforced link from a COMPLETED submission back to the Show that answered it; it's editorial bookkeeping.

### Transcripts

**Transcript**:
The transcription of a Show. One Transcript per Show.

**Utterance** (`transcriptUtterance`):
A continuous segment of speech from one speaker in a Transcript. The atomic unit displayed in the transcript UI.

**Word** (`transcriptUtteranceWord`):
Word-level timing inside an Utterance. Optional and very large (millions of rows); often skipped in exports/migrations. See `docs/archive/large-table-export-options.md` for handling guidance.

## Relationships

- **Syntax** has many **Shows**.
- A **Show** has many **Hosts** (through `show_to_user`) and many **Guests** (through `show_guest`).
- A **Show** has one **Transcript**, which has many **Utterances**, which have many **Words**.
- A **Show** has zero or more AI artifacts (`aiShowNote`, `aiTweet`, etc.).
- A **Show**, **Article**, **Video**, etc. is (eventually) wrapped by one **Content** row of the corresponding `content_type`. See [ADR-0004](./adr/0004-unified-content-model.md).

## Example dialogue

> **Dev:** "I want to add SEO meta tags to every episode page."
> **Domain expert:** "Sure — those pages render a **Show**. Add the fields to the `show` table for now. Once a **Show** is wrapped by a **Content** row, we'll lift the SEO fields up to **Content** so Articles and Videos inherit the same shape."

> **Dev:** "Can a Guest log in to edit their own profile?"
> **Domain expert:** "No. A **Guest** is not a **User**. Only Hosts (who are Users with admin roles) log in. If we ever let returning Guests sign in, that would be a new feature and a new mapping — and we'd want an ADR for it."

> **Dev:** "What's a Supper Club episode?"
> **Domain expert:** "A back-catalog **Show** with a guest. We don't really use the **show_type** labels for new episodes — current ones are just Mon or Wed releases."

## Flagged ambiguities

- "Show" historically meant both the podcast (Syntax) and a single episode. **Resolved**: a row in the `show` table is a **Show** (an episode); the podcast itself is **Syntax**.
- "User" used to imply public accounts. **Resolved**: no public accounts exist; every **User** is effectively an admin. If/when public accounts are added, this entry must be re-resolved.
- `show_type` reads like a current taxonomy but is a back-catalog artifact. **Resolved**: documented above; the column is unreliable for recent episodes.
- "UserSubmission" implies it's tied to a **User** (the capital-U admin entity); it isn't. The "User" in the name is the colloquial sense (a site visitor), not the `user` table row. Submissions are anonymous and have no FK to `user`.
- The admin URL segment `/admin/content/podcast` lists **Shows**, not "podcasts." **Resolved**: the URL matches the `content_types` enum value (`PODCAST`), which is machine-canonical; the page heading and navigation label remain "Shows" (the domain term). This is a deliberate asymmetry between URL/enum and display language. Do not rename the URL to match the term without renaming the enum value, and do not rename the enum without a migration ADR.
