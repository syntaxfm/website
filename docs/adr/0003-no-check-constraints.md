# ADR-0003 — Application-level validation, not database CHECK constraints

## Status

Accepted. Applied during the v3 schema build-out.

## Decision

Data integrity for ranges and business rules (e.g. "episode numbers must be positive," "utterance end-time must exceed start-time") is enforced in application code, not via Postgres `CHECK` constraints.

## Why

When we tried to push the originally-planned CHECK constraints (`shows.number > 0`, `transcript_utterances.end > start`, `transcript_utterance_words.end > start`) against real data, the schema push failed:

```
ERROR: check constraint "shows_number_positive" is violated by some row
ERROR: check constraint "transcript_utterance_words_time_range_valid" is violated by some row
```

The "violations" turned out to be legitimate data:

- Episode 0 exists (an intro episode) and Specials sometimes have non-positive numbers.
- Some transcribed words have `end = start` (zero-duration words emitted by Deepgram on certain edge cases).

The choice was: change the data to fit the constraint, or drop the constraint. We dropped the constraint — the data reflects reality and the constraint was wrong.

## Trade-offs

- A buggy writer can introduce nonsense without the database catching it. The mitigation is validation at the API/action layer (Valibot is already in use for admin remote modules) and at AI-generation boundaries.
- Migrations don't fail on existing data, which makes refresh-mode imports far easier.

## Rule

Don't add CHECK constraints. Validate at the boundary where the data enters the system (form action, API endpoint, migration transformer). The database is for storing what is, not enforcing what should be.
