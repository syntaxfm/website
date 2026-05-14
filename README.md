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
- Install PostgreSQL or use docker with the provided `docker-compose.yml` file.

This site uses PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/), so you will need a valid PostgreSQL connection string. See [`docs/adr/0001-drizzle-postgres-over-prisma-mysql.md`](./docs/adr/0001-drizzle-postgres-over-prisma-mysql.md) for the rationale behind this stack.

## Getting Started

### Without Docker

Have your database connection string handy.

1. `pnpm install`
2. `pnpm preheat`
3. `pnpm dev`

That's it!

### With Docker

1. Read Prerequisites above ^^ before starting
1. Copy `.env.example` to `.env` and specify env variables (needs at least `DATABASE_URL`, see [here](#where-to-get-your-own-environment-variables) for how to get the others)
   - If using Docker, the included `docker-compose.yml` runs a local PostgreSQL on port `5434`. Set `DATABASE_URL` to match — e.g.:
     ```sh
     DATABASE_URL=postgresql://root:mysecretpassword@localhost:5434/local
     REDIS_PORT=6379
     REDIS_HTTP_PORT=8079
     UPSPLASH_TOKEN=supersecret
     UPSPLASH_URL=http://localhost:${REDIS_HTTP_PORT}
     ```
     Adjust credentials to match `docker-compose.yml` if you've customized it.
1. If using docker, in a separate tab run -> `docker compose up`
1. Run -> `pnpm preheat`
1. Run -> `pnpm dev`
1. Visit `http://localhost:5173`

### Scripts

- DB studio: `pnpm drizzle-kit studio`
- Generate migration from schema: `pnpm drizzle-kit generate`
- Apply migrations: `pnpm drizzle-kit migrate`
- DB seed: `pnpm db:seed`

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

| Variable                     | Where to get it                                                         | Notes                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| PUBLIC_GITHUB_ID, GH_SECRET  | [Github Oauth Apps](https://github.com/settings/developers)             | Create new OAuth App, set `http://localhost:5173/api/oauth/github/callback` as the redirect URL |
| DEEPGRAM_SECRET              | [Deepgram](https://console.deepgram.com/)                               |                                                                                                 |
| SENTRY_AUTH_TOKEN            | [Sentry](https://docs.sentry.io/product/accounts/auth-tokens/)          |                                                                                                 |
| OPENAI_API_KEY               | [Open AI](https://platform.openai.com/account/api-keys)                 |                                                                                                 |
| UPSPLASH_TOKEN, UPSPLASH_URL | [https://upstash.com/](https://upstash.com/)                            | Create a redis DB after sign up in the console                                                  |
| YOUTUBE_API_KEY              | [Google API Console](https://console.cloud.google.com/apis/credentials) | Create an API key, visit the library and enable "YouTube Data API v3"                           |

# Our Contributors

<a href="https://github.com/syntaxfm/website/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=syntaxfm/website" />
</a>
