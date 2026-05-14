# ADR-0002 — Text IDs, not UUIDs

## Status

Accepted. Applied during the v3 schema build-out.

## Decision

The primary keys on `show`, `video`, and `playlist` are stored as `text`, not `uuid`. New tables built from scratch in v3 (e.g. `user`, `content`, `tag`) do use `uuid` defaults where appropriate.

## Why

The original plan was to convert `show.id`, `video.id`, and `playlist.id` from `text` to `uuid` for "better performance." Once we ran the conversion we discovered the IDs in production look like:

```
syntax_podcast_show_00000
```

These are **custom string identifiers**, not UUIDs. They're used in URLs, in markdown frontmatter under `/shows/`, in external systems (Megaphone, RSS), and in cache keys.

Forcing a UUID type would have required either:
- Generating new UUIDs (breaking every external reference), or
- A complex multi-phase rewrite of every consumer.

The "performance win" was real but tiny — ~20 bytes per row at our scale (thousands of shows, not billions). The complexity cost was huge.

## Trade-offs

- `text` keys are slightly larger and join slightly slower than native `uuid`. At our row counts the difference is in microseconds.
- Type coercion at API boundaries needs care: a `show.id` is not parseable as a UUID, so any code or library that assumes UUIDs will break.

## Rule

For tables that already carry custom string IDs (show, video, playlist), keep `text`. For new tables where no external system pins the ID format, default to `uuid` with `defaultRandom()`.
