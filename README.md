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
- A read-only **production Postgres connection string** (core team: loaded from 1Password automatically).

This site uses PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/). See [`docs/adr/0001-drizzle-postgres-over-prisma-mysql.md`](./docs/adr/0001-drizzle-postgres-over-prisma-mysql.md) for the rationale behind this stack.

## Getting Started

```sh
pnpm preheat   # asks about 1Password on first run (core team), then sets everything up
pnpm dev       # http://localhost:5173
```

`pnpm preheat` installs dependencies, starts Postgres in Docker (`localhost:5434`), copies production data into it (~15s), and applies any pending migrations. It is safe to re-run; it only copies prod when the local database is empty.

The local database is a disposable copy. Production is only ever read.

### Environment variables

Env vars are declared in [`.env.schema`](./.env.schema) and loaded with [varlock](https://varlock.dev). The defaults there are enough to run locally. Put your own values in `.env.local` (gitignored).

Core team: answer yes when `pnpm preheat` asks about 1Password. It installs the [1Password CLI](https://www.1password.dev/cli/get-started/) if needed, checks you can open the Syntax.fm vault, and saves `USE_1PASSWORD=true` to `.env.local`. Secrets then load from the vault (see [`.env.1password`](./.env.1password)). Use `pnpm exec varlock load` to check what resolved.

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

Admin authentication uses the shared session from `auth.syntax.fm`. In development, `pnpm dev`
starts the shared local Syntax Auth on `http://localhost:37960` (Docker required). Sign in with
**Continue as Local Developer**; `pnpm preheat` makes that account an admin in your local database.

Admin pages and `/login` send a signed-out browser to `/__syntax_auth/sign-in` on the address it
is already using, so local sign-in works wherever you open the site, with no hosts-file,
certificate, or source changes:

- **This computer:** `http://localhost:5740` works out of the box.
- **Another device on your network or tailnet:** run `pnpm dev --host`, then open this computer's
  LAN or Tailscale IP, such as `http://100.101.102.103:5740`. IP addresses and `localhost` work by
  default. To use a name instead (such as a MagicDNS name), list its origin in
  `SYNTAX_AUTH_PUBLIC_ORIGINS`, in `.env.local` or for one run:
  `SYNTAX_AUTH_PUBLIC_ORIGINS=http://mini.example.ts.net:5740 pnpm dev --host`.
- **Your own HTTPS name:** put an HTTPS proxy you manage in front of `http://localhost:5740`, have it
  pass the browser's `Host` header through (Caddy's `reverse_proxy` does by default), and list its
  https origin, such as `SYNTAX_AUTH_PUBLIC_ORIGINS=https://dev.example`. The site never reads
  forwarded-protocol headers or redirects to HTTPS itself, and sign-in, sign-out, and their
  redirects stay on the name you opened. Separate several origins with commas or spaces.

If local Syntax Auth is stopped, refuses, or doesn't answer within 5 seconds, admin pages, `/login`,
and sign-out answer with a page naming the problem and the fix: restart `pnpm dev`. Public pages
keep working signed out.

# Our Contributors

<a href="https://github.com/syntaxfm/website/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=syntaxfm/website" />
</a>
