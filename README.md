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
- A read-only **production Postgres connection string**, needed only while your local database is
  empty or when you refresh it (core team: loaded from 1Password).
- For admin sign-in during development: Docker running whenever `pnpm dev` runs (it starts local
  Syntax Auth in a container).

This site uses PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/). See [`docs/adr/0001-drizzle-postgres-over-prisma-mysql.md`](./docs/adr/0001-drizzle-postgres-over-prisma-mysql.md) for the rationale behind this stack.

## Getting Started

```sh
pnpm preheat   # asks about 1Password on first run (core team), then sets everything up
pnpm dev       # http://localhost:5740
```

`pnpm preheat` ([`scripts/preheat.js`](./scripts/preheat.js)) is safe to re-run. In order, it:

1. Checks for Node 22+, pnpm, and a running Docker.
2. If an old-style `.env` exists, points its `DATABASE_URL` at the local Docker database and moves
   a remote `POSTGRES_DATABASE_URL` (which the app would prefer) to `PROD_DATABASE_URL`.
3. Asks once whether to use 1Password and saves the answer as `USE_1PASSWORD` in `.env.local`. If
   yes, it checks for the 1Password CLI (offering a Homebrew install) and that you can open the
   team vault.
4. Runs `pnpm install`, then resolves every variable in `.env.schema` so problems show up now.
5. Starts Postgres 18 with `docker compose` on port `5434`. Its data lives in a named Docker
   volume, so it survives container restarts and re-runs.
6. **Only if the local database has no tables**, copies production into it: `pg_dump` (inside the
   container) reads the `public` and `drizzle` schemas from `PROD_DATABASE_URL` and restores them
   locally. Production is only read. If `PROD_DATABASE_URL` doesn't resolve, it asks for one in
   the terminal and saves it in `.env.local`.
7. If the copy has no migration history, records the migrations its schema already has (through
   `0001_puzzling_talos`, see [ADR-0001](./docs/adr/0001-drizzle-postgres-over-prisma-mysql.md)),
   then applies pending migrations with `drizzle-kit migrate` against the local database only.
8. Makes the Local Developer an admin in the local database (see [Admin sign-in](#admin-sign-in)).

`pnpm db:pull` runs the same steps without `pnpm install`, but always replaces the local database
with a fresh copy of production. When the local database already has data it asks first; without
a terminal to ask in it refuses unless you pass `--yes`.

Preheat and `db:pull` only read production and apply migrations locally. With the normal local
configuration, the app reads and writes the local copy; keep both application database URLs local.
`pnpm dev` and a deploy (Vercel runs `pnpm build`) do not run preheat or migrations automatically.
Re-run `pnpm preheat` after pulling new migrations. Back up local changes before replacing the copy.

### Local Postgres and your network

[`docker-compose.yml`](./docker-compose.yml) publishes Postgres as `5434:5432` with no host
address, so Docker listens on port 5434 on every network interface of this computer, not only
localhost. Its credentials are the well-known defaults in that file, and the database holds a copy
of production. Before copying production data, publish it on loopback only with a local Compose
override file that you don't commit (Docker Compose 2.24.4 or later):

```yaml
# docker-compose.override.yml (keep it out of git, for example via .git/info/exclude)
services:
  db:
    ports: !override
      - '127.0.0.1:5434:5432'
```

`docker compose` reads that file automatically, so `pnpm preheat` and `pnpm db:start` recreate the
container with the new binding and keep the data volume. It binds IPv4 loopback only; the default
URLs use `localhost`, so if a tool resolves that to IPv6 `::1` and can't connect, use `127.0.0.1`
in your own `DATABASE_URL` in `.env.local`. Compose derives its project name from the checkout's
directory name unless you set `COMPOSE_PROJECT_NAME`. Checkouts using the same project name share
its containers and volume; different names use different volumes. Only one can hold port 5434.

### Environment variables

Env vars are declared in [`.env.schema`](./.env.schema) and loaded with [varlock](https://varlock.dev). The defaults there are enough to run locally. Put your own values in `.env.local`, which is gitignored (`.env.*`) and never committed.

Core team: answer yes when `pnpm preheat` asks about 1Password. It installs the [1Password CLI](https://www.1password.dev/cli/get-started/) if needed, checks you can open the Syntax.fm vault, and saves `USE_1PASSWORD=true` to `.env.local`. Secrets then load from the vault (see [`.env.1password`](./.env.1password)). Use `pnpm exec varlock load` to check what resolved; it masks sensitive values.

With `USE_1PASSWORD=true`, values are read live from the vault by each new process that loads the
env (`pnpm dev`, `pnpm db:pull`, `drizzle-kit`, `varlock` itself), so 1Password may ask you to
approve each one. `pnpm check` (which sets `USE_1PASSWORD=false`) and `pnpm test:unit` don't
load secrets and never ask.

`USE_1PASSWORD=false` with your own values in `.env.local` is equally supported, whether you have
no vault access or would rather not approve each process. If you keep copies of team secrets
there, treat the file as a secret: readable only by you (`chmod 600 .env.local`), never copied into
the repo, shared, or pasted, and updated when a secret is rotated (stale values fail like wrong
ones). Trusted setup automation can use Varlock's existing `load --format env` export to resolve
configured values once and write them straight to a private file, never to a terminal or log.
Preserve existing database and origin settings, cache only the configured website values, and set
`USE_1PASSWORD=false` for subsequent starts. Do not ask teammates to copy secrets by hand.

Keep `POSTGRES_DATABASE_URL` unset locally. The app and `drizzle-kit` prefer it over
`DATABASE_URL`, so a remote value there points local dev at that database. Production is read only
through `PROD_DATABASE_URL`, and only by `pnpm preheat` and `pnpm db:pull`.

### Copied data and development telemetry

Development does not currently disable Sentry traces, profiles, or browser replay; replay is
configured without masking text or media. Plausible requests also remain active. Keep copied
production data private: block development telemetry egress on both the server and browser before
using the copy. A private database binding alone does not prevent telemetry export. There is no
built-in development telemetry-off switch yet; do not assume `NODE_ENV=development` supplies one.

### Scripts

- Dev server: `pnpm dev` (http://localhost:5740; add `--host` to opt in to network access)
- DB studio: `pnpm drizzle-kit studio`
- Generate migration from schema: `pnpm drizzle-kit generate`
- Apply pending migrations to the local DB: `pnpm preheat` (forces the local database)
- Refresh local data from prod: `pnpm db:pull` (replaces the local DB, then applies pending migrations)
- Start local Postgres: `pnpm db:start`

For the full schema-change workflow, including resetting the local database, see
[`docs/schema-workflow.md`](./docs/schema-workflow.md).

### About this codebase

Just about all major code folders live in `/src`, with the exception of `/shows` (the markdown source of truth for podcast episodes) and `/drizzle` (generated SQL migration files). The database schema lives in `src/server/db/schema.ts`.

For contributor and agent guidance, see [`AGENTS.md`](./AGENTS.md). For domain language (Show vs Syntax, Host vs Guest, the unified `content` model), see [`docs/CONTEXT.md`](./docs/CONTEXT.md). For decisions like Drizzle/Postgres, text IDs, and naming conventions, see [`docs/adr/`](./docs/adr/).

Website feature and maintenance work is tracked in this repository's Dex. Shared Auth and
cross-project setup/documentation work is tracked in Lab's Dex; keep those records linked rather
than creating duplicate active tasks.

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

Every variable is optional for local development unless `.env.schema` marks it required, and the
required ones have working defaults. Add a value only for the feature you're working on.

| Variable                                                        | Where to get it                                                                                     | Notes                                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| DEEPGRAM_SECRET                                                 | [Deepgram](https://console.deepgram.com/)                                                           | Transcript generation                                                 |
| OPENAI_API_KEY, ANTHROPIC_KEY                                   | [OpenAI](https://platform.openai.com/account/api-keys), [Anthropic](https://console.anthropic.com/) | AI show notes                                                         |
| YOUTUBE_API_KEY                                                 | [Google API Console](https://console.cloud.google.com/apis/credentials)                             | Create an API key, visit the library and enable "YouTube Data API v3" |
| MEGAPHONE_API_TOKEN, MEGAPHONE_NETWORK_ID, MEGAPHONE_PODCAST_ID | Syntax team                                                                                         | Episode sync                                                          |
| CONVERT_KIT_SECRET, CONVERT_KIT_V4_API_KEY                      | Syntax team                                                                                         | Newsletter signup                                                     |
| CRON_SECRET                                                     | Any random string you choose                                                                        | Guards `/webhooks/*` and `/cron/*`                                    |
| SENTRY_AUTH_TOKEN, CODECOV_TOKEN                                | [Sentry](https://docs.sentry.io/product/accounts/auth-tokens/), Codecov                             | Build-time uploads only                                               |

### Admin sign-in

Admin authentication uses the shared session from `auth.syntax.fm`; this site stores no users or
sessions ([ADR-0007](./docs/adr/0007-central-syntax-auth.md)). Roles come only from the local
**Profile** mapped to your central User ID. In production the Auth address is fixed in code, a
signed-out admin page sends you to `https://auth.syntax.fm/sign-in`, and any Auth failure counts
as signed out.

In development, `pnpm dev` starts the shared local Syntax Auth container on
`http://localhost:37960` (Docker required). It is published on loopback (`127.0.0.1`) only, and
browsers never talk to it directly. Sign in with **Continue as Local Developer**; `pnpm preheat`
maps that account (central User ID `local-developer`) to a Profile with the admin role in your
local database. Without that mapping you are signed in but get "Admin access required".

Admin pages and `/login` send a signed-out browser to `/__syntax_auth/sign-in` on the address it
is already using, so local sign-in works wherever you open the site, with no hosts-file,
certificate, or source changes:

- **This computer:** `http://localhost:5740` works out of the box. The dev server listens on
  localhost only unless you opt in.
- **Another device on your LAN or tailnet:** opt in with `pnpm dev --host`, then open this
  computer's LAN or Tailscale IP address. IP addresses and `localhost` work with no setting.
  Named devices follow the hostname configuration below; expose development only to trusted peers.
- **A name:** to use a hostname instead of an IP, list its exact origin in
  `SYNTAX_AUTH_PUBLIC_ORIGINS`, in `.env.local` or for one run:
  `SYNTAX_AUTH_PUBLIC_ORIGINS=http://devbox.example.com:5740 pnpm dev --host`. The dev server then
  accepts that name too.
- **Your own HTTPS name:** put an HTTPS proxy you manage in front of `http://localhost:5740`, have it
  pass the browser's `Host` header through (Caddy's `reverse_proxy` does by default), and list its
  https origin, such as `SYNTAX_AUTH_PUBLIC_ORIGINS=https://dev.example.com`.

Each listed value must be a bare `http://` or `https://` origin (no path or credentials); an invalid
one stops the dev server. Separate several with commas or spaces. Beyond the address a request
itself shows, only listed origins count: the site never reads forwarded-protocol headers or redirects to HTTPS itself, and sign-in,
sign-out, and their redirects stay on the scheme and name you opened. Each address keeps its own
host-only sign-in cookie (`__Secure-` cookies over HTTPS), so signing in at one address doesn't
sign you in at another. Local Syntax Auth's response bodies never reach the browser, and sign-out
is accepted only from the site's own page at that address.

#### When local Syntax Auth is down

In development, session checks for admin pages, `/login`, and admin remote functions have a
5-second deadline covering both response headers and reading the session body. Sign-out bounds
its wait for headers to 5 seconds, then uses the status and separate cookie clears and discards
the body without validating it. A successful headers-only sign-out does not wait for a stalled
body. These direct website calls currently use only their timeout signal; incoming browser-request
cancellation is not yet propagated (follow-up `0cgtvtay` in Lab's Dex). If session validation or
sign-out's header/status check fails:

- **Page loads and navigations** answer 503 with the problem and the fix: make sure Docker is
  running, then restart `pnpm dev`. Requests that don't want HTML get the same as JSON.
- **Remote queries** (reads) send the browser to a diagnostic page with the same fix and a link
  back to the page you were on.
- **Remote commands and forms** (writes) fail with a 503 error carrying the fix. The function
  never runs and nothing is retried automatically; retry it yourself once Auth is back.

Admin remote calls also explain an ended sign-in instead of failing generically: a read sends you
to sign in, a write fails with "Sign in needed … Nothing was changed", and a signed-in user without the admin
role gets "Admin access required". None of these change roles: a failure never grants or keeps
one. Public pages don't ask Auth unless you have a cookie, and they keep working signed out.

# Our Contributors

<a href="https://github.com/syntaxfm/website/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=syntaxfm/website" />
</a>
