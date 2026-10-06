# Archive

Historical documentation that is no longer the working reference, but retained for context. Don't follow these as procedures: each starts with a note on what is superseded. The current references are the [README](../../README.md) (local setup, env, admin sign-in), [`schema-workflow.md`](../schema-workflow.md) (schema changes, migrations, local resets), and the [ADRs](../adr/README.md).

- **[migrate-v2-to-v3.md](./migrate-v2-to-v3.md)** — The Prisma → Drizzle ORM cutover during v3. Its original claim that `preheat` migrates production automatically on deploy is not true of the current code and has been corrected; local tooling never touches production. The decision itself lives in [ADR-0001](../adr/0001-drizzle-postgres-over-prisma-mysql.md).
- **[postgres-migration-guide.md](./postgres-migration-guide.md)** — Full MySQL → Postgres data migration procedure (`direct-db-migration.js`, verification, phased cutover). Historical; relevant only for further reconciliation against the legacy MySQL. Several commands it used no longer exist.
- **[large-table-export-options.md](./large-table-export-options.md)** — Speed/strategy options for moving massive tables (notably `transcript_utterance_words`). Of the scripts it names, only `scripts/direct-db-migration.js` still exists; the trade-offs remain accurate background.

If a document here turns out to still be the working reference for something, move it back up to `docs/`.
