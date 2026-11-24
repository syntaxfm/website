# ADR-0008 — Guests, hosts, transcripts and AI notes link to `content.id`

## Status

Accepted (2026-11-24). Follows ADR-0004.

## Decision

Everything that belongs to a piece of content links to its permanent `content.id`:
`content_guests`, `content_hosts`, `transcripts.content_id` and `ai_show_notes.content_id`.
They used to link by episode number (`transcripts`, `ai_show_notes`) or by the show's text id,
which is built from the number (`show_guests`, `show_to_profile`).

## Why

An episode's number is an editable label, not an identity. Linking by it meant renumbering an
episode had to rewrite four tables (or cascade foreign keys onto the number), and only episodes
could have guests, hosts, transcripts or notes. Linked by content id, a number change touches one
row, and videos (or any future content type) get the same links with no new tables.

## Consequences

- Link rows have a `position` (the order they were added); queries that list guests or hosts sort
  by it (`in_order_added`), since Postgres returns rows in whatever order is cheapest.
- An episode without a `content_id` can't have links; the importers create its content row first.
- `ai_show_notes` keeps its name for now even though notes can belong to any content.
