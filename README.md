# Syntax.

A tasty treats podcast for Web Developers.

This is the site that runs [Syntax.fm](https://syntax.fm) — go there to listen to it!

This site is built on SvelteKit.

## Requirements

- Node 22.0.0 or higher

## Prerequisite

- Install Node - https://nodejs.org/en
- Install pnpm - https://pnpm.io/installation
  - If you are on a Mac, there is an issue with the curl install.
  - Preferably, use homebrew to install:
    - `brew install pnpm`
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [OrbStack](https://orbstack.dev/) and have it running.
- A read-only **production Postgres connection string** (core team: from PlanetScale).

This site uses PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/). See [`docs/adr/0001-drizzle-postgres-over-prisma-mysql.md`](./docs/adr/0001-drizzle-postgres-over-prisma-mysql.md) for the rationale behind this stack.

## Getting Started

```sh
pnpm preheat   # prompts for the prod connection string on first run
pnpm dev       # http://localhost:5173
```

`pnpm preheat` creates `.env`, installs dependencies, starts Postgres in Docker (`localhost:5434`), copies production data into it (~15s), and applies any pending migrations. It is safe to re-run; it only copies prod when the local database is empty.

The local database is a disposable copy. Production is only ever read.

### Scripts

- DB studio: `pnpm drizzle-kit studio`
- Generate migration from schema: `pnpm drizzle-kit generate`
- Apply migrations: `pnpm drizzle-kit migrate`
- Refresh local data from prod: `pnpm db:pull` (replaces the local DB, then applies pending migrations)
- Start local Postgres: `pnpm db:start`

For the full schema-change workflow, see [`docs/schema-workflow.md`](./docs/schema-workflow.md).

### About this codebase

Just about all major code folders live in `/src`, with the exception of `/shows` (the markdown source of truth for podcast episodes) and `/drizzle` (generated SQL migration files). The database schema lives in `src/server/db/schema.ts`.

For contributor and agent guidance, see [`AGENTS.md`](./AGENTS.md). For domain language (Show vs Syntax, Host vs Guest, the unified `content` model), see [`docs/CONTEXT.md`](./docs/CONTEXT.md). For decisions like Drizzle/Postgres, text IDs, and naming conventions, see [`docs/adr/`](./docs/adr/).

|              |                                                                                               | Alias      |
| ------------ | --------------------------------------------------------------------------------------------- | ---------- |
| `/actions`   | Svelte Actions, these are reusable functions that act as lifecycle on DOM elements            | $actions   |
| `/assets`    | Static assets that are used via @import                                                       | $assets    |
| `/server`    | All database and server-side only reusable code                                               | $server    |
| `/lib`       | (SK Paradigm) Components and files that are used in more than one route                       | $lib       |
| `/params`    | (SK Paradigm) This is a SvelteKit specific folder to add validation on parameter based routes |            |
| `/routes`    | (SK Paradigm) File System based routing                                                       |            |
| `/state`     | Global State containers and resolvers                                                         | $state     |
| `/styles`    | CSS                                                                                           |
| `/utilities` | Global Utility functions                                                                      | $utilities |
| `/`          | Root                                                                                          | $          |

### Stylin'

These are the available media queries:

```css
@custom-media --below-small (width < 400px);
@custom-media --below-med (width < 700px);
@custom-media --below-large (width < 900px);
@custom-media --below-xlarge (width < 1200px);
@custom-media --above-small (width > 400px);
@custom-media --above-med (width > 700px);
@custom-media --above-large (width > 900px);
@custom-media --above-xlarge (width > 1200px);

// Usage
@media (--above-med) {
}
```

### Where to get your own Environment Variables

| Variable                     | Where to get it                                                         | Notes                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| DEEPGRAM_SECRET              | [Deepgram](https://console.deepgram.com/)                               |                                                                       |
| SENTRY_AUTH_TOKEN            | [Sentry](https://docs.sentry.io/product/accounts/auth-tokens/)          |                                                                       |
| OPENAI_API_KEY               | [Open AI](https://platform.openai.com/account/api-keys)                 |                                                                       |
| UPSPLASH_TOKEN, UPSPLASH_URL | [https://upstash.com/](https://upstash.com/)                            | Create a redis DB after sign up in the console                        |
| YOUTUBE_API_KEY              | [Google API Console](https://console.cloud.google.com/apis/credentials) | Create an API key, visit the library and enable "YouTube Data API v3" |

Admin authentication uses the shared session from `auth.syntax.fm`. Plain localhost cannot receive
the `.syntax.fm` cookie; use a controlled HTTPS development subdomain or tunnel under `syntax.fm`
for authenticated QA.

# Our Contributors

<a href="https://github.com/syntaxfm/website/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=syntaxfm/website" />
</a>
