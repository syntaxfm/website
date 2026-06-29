---
name: syntax-qa
description: Use when manually QAing Syntax website changes across remote functions, API/webhook endpoints, the admin area, the database, or the public UI; selecting smoke checks after code changes; using the chrome-devtools MCP for browser flows; verifying local behavior beyond tests, typecheck, and lint.
---

# Syntax QA

Use after Syntax website code changes need manual behavior checks. This is not a
test/typecheck/lint checklist — pair it with `pnpm check`, `pnpm lint`, and the
relevant `pnpm test` / `pnpm test:unit` run, then do the behavior QA below.

## Select Surfaces

| Changed area                                                  | QA                                            |
| ------------------------------------------------------------- | --------------------------------------------- |
| Public remote functions (`src/**/*.remote.ts` outside admin)  | Remote fn + the route/UI that calls it        |
| Admin remote functions (`src/routes/(site)/admin/**.remote.ts`) | Admin UI + DB side effect                   |
| API/webhook endpoints (`src/routes/**/+server.ts`)            | Endpoint response + any side effect           |
| Public UI (`src/routes/(site)/**`, `(blank)/**`)              | UI + the remote fn / load it depends on       |
| Admin UI (`src/routes/(site)/admin/**`)                       | Admin flow + DB write it performs             |
| `src/server/**` (shows, transcripts, ai, video, auth)         | Caller route/endpoint + observable side effect|
| Schema / migration (`src/server/db/schema.ts`, `drizzle/**`)  | Migration + a remote fn/endpoint + UI that reads/writes it |

## Start Local Runtime

For normal QA, prefer the root `pnpm dev` command — it runs the full SvelteKit
app (public site, admin, remote functions, and `+server.ts` endpoints) in one
process against your `.env` config. Use the narrower commands only when
intentionally isolating the database or inspecting data.

| Need               | Command                                  | URL                          |
| ------------------ | ---------------------------------------- | ---------------------------- |
| Full app           | `pnpm dev`                               | `http://localhost:5740` (leet "syntax") |
| Local Postgres     | `pnpm db:start` (separate terminal)      | Postgres on `localhost:5434` |
| Inspect/edit data  | `pnpm db:studio`                         | Drizzle Studio (prints URL)  |

Notes:

- The dev server is pinned to `5740` (leet for "syntax": s=5, t=7, a=4) in
  `vite.config.ts`. If that port is busy Vite auto-increments — watch the dev
  server banner for the actual URL, or override with `pnpm dev -- --port <port>`.
- `pnpm db:start` runs the `docker-compose.yml` Postgres (user `root`, db
  `local`, port `5434`). The app reads its DB connection from `.env`.
- The legacy MySQL path (`src/server/db/x-*.ts`) is migration-only — do **not**
  QA new behavior through it; new code uses Postgres via Drizzle.

## Endpoint QA (`+server.ts`)

1. Identify the exact route file and method (`GET`/`POST`/etc.).
2. Hit the local server, not `syntax.fm`: `http://localhost:5740`.
3. For public reads, `curl` the route and check the JSON/response shape, status,
   and headers (several set `Access-Control-Allow-Origin`).
4. For webhooks and `POST` endpoints, send a representative payload and verify
   the success path, a validation/auth failure, and the DB/cache side effect.
5. If the endpoint backs a UI or feed, QA that consumer too.

Useful public refs to compare against (read-only):

- Shows list: `http://localhost:5740/api/shows`
- Latest show: `http://localhost:5740/api/shows/latest`
- One show: `http://localhost:5740/api/shows/<number>`
- Transcript: `http://localhost:5740/api/transcripts/<number>`
- Feeds/meta: `/content.json`, `/sitemap.xml`, `/robots.txt`
- OG image: `/og/<show_number>.jpg`

Webhook/cron endpoints (`/webhooks/transcripts`, `/webhooks/refresh`,
`/webhooks/ai`, `/cron/publish`) are protected and/or side-effecting — drive
them only with local throwaway data and verify the resulting DB row or cache
state, not just the HTTP status.

## Remote Function QA (`*.remote.ts`)

Remote functions are SvelteKit RPC, not plain REST — QA them through the route
or component that calls them rather than curling them directly.

1. Find the calling route/component (search for the imported function name).
2. Exercise it in the browser (see UI QA) and confirm the rendered result.
3. For mutations, verify the DB side effect in Drizzle Studio (`pnpm db:studio`).
4. Check the unhappy paths the function declares — admin remote modules validate
   inbound payloads with Valibot, so confirm a bad payload is rejected, not
   silently accepted.
5. Public remote modules to keep in mind: `shows`, `guests`, `sickpicks`,
   `newsletter`, `submissions`, `feed`, `user`. Admin ones live under
   `src/routes/(site)/admin/**`.

## Local Auth for QA

Auth is GitHub OAuth + a cookie session (`access_token`) resolved in
`src/hooks.server.ts`. There is **no CLI token flow** — do not invent one.

- **Public pages** need no auth.
- **Admin (`/admin/**`)** is gated to users with the `admin` role. In dev there
  is a bypass: `hooks.server.ts` resolves the first admin user in the local DB
  and attaches it, so `/admin` is reachable locally **without** completing
  OAuth. This branch is tree-shaken out of production builds.
- If `/admin` redirects you to `/login` locally, your local Postgres has no user
  holding the `admin` role. Seed one (e.g. via Drizzle Studio: add a `user`, add
  the `admin` role, link them in `userRole`). On real OAuth login, the crew
  usernames in `find_or_create_user` are auto-promoted to `admin`.
- Keep any seeded/local credentials out of committed docs and final reports.

## UI QA

1. Start the app with `pnpm dev` (and `pnpm db:start` if you need live data).
2. Use the **chrome-devtools MCP** tools for browser checks — `navigate_page`,
   `take_snapshot`, `take_screenshot`, `click`/`fill`, `list_network_requests`,
   and `list_console_messages`.
3. Verify desktop and mobile widths for changed user-facing flows
   (`resize_page` / `emulate`). The app uses custom-media breakpoints at 400 /
   700 / 900 / 1200px — check at least one mobile and one desktop width.
4. Inspect rendered state, the underlying remote-fn/endpoint network outcome,
   persistence after reload, and the error/empty/loading states when changed.
5. Watch the console for errors and check the network panel for failed remote
   calls — a green page can still be firing a 500 underneath.
6. For admin editors, confirm the change persists to the DB (Drizzle Studio).
   Admin forms keep explicit Save buttons by design; the public site does not.
7. Clean up any throwaway local rows you created when done.

## Finish With Evidence

Report:

- Surfaces QAed: Endpoints / Remote functions / UI / DB.
- Commands and URLs used.
- Browser viewport(s), if UI.
- Data used or created (and that it was cleaned up).
- Pass/fail per scenario.
- Any skipped surface and why.
