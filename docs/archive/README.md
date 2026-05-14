# Archive

Historical documentation that is no longer the working reference, but retained for context.

- **[migrate-v2-to-v3.md](./migrate-v2-to-v3.md)** — Procedure for the Prisma → Drizzle ORM cutover during v3. The cutover is complete; this is kept for reconstruction of what happened. The decision itself lives in [ADR-0001](../adr/0001-drizzle-postgres-over-prisma-mysql.md).
- **[postgres-migration-guide.md](./postgres-migration-guide.md)** — Full MySQL → Postgres data migration procedure (`direct-db-migration.js`, verification, phased cutover). Mostly historical now; relevant if doing further reconciliation against the legacy MySQL via `src/server/db/x-*.ts`.
- **[large-table-export-options.md](./large-table-export-options.md)** — Speed/strategy options for exporting massive tables (notably `transcript_utterance_words`). Kept because the export scripts referenced here still exist and the trade-offs remain accurate if you ever need to move that table again.

If a document here turns out to still be the working reference for something, move it back up to `docs/`.
