# Syntax.

A tasty treats podcast for Web Developers.

This is the site that runs [Syntax.fm](https://syntax.fm) — go there to listen to it!

This site is built on SvelteKit

## Requirements

- Node 20.0.0 or higher

## Development

First you `pnpm install`

2nd seed the db `pnpm db:seed`

Then you `pnpm dev` and visit `http://localhost:5173`.

Then you do some work.

When you are ready for prime time, you can just submit a PR to this repo and it will be deployed once it's accepted.

If you want to build your own version, just run `pnpm build` and then I'd recommend deploying with `now`.

### Scripts

DB studio `pnpm db:studio`
DB Migrations `pnpm db:push`
DB Seed `pnpm db:seed`

### About this codebase

Just about all major code folders live in `/src` with the exception of `/shows` - the md source of truth for all podcast episodes as well as `/prisma` for our db connections and schema.

|              |                                                                                               | Alias      |
| ------------ | --------------------------------------------------------------------------------------------- | ---------- |
| `/actions`   | Svelte Actions, these are reusable functions that act as lifecycle on DOM elements            | $actions   |
| `/assets`    | Static assets that are used via @import                                                       | $assets    |
| `/db`        | All database and server-side only reusable code                                               | $db        |
| `/lib`       | (SK Paradigm) Components and files that are used in more than one route                       | $lib       |
| `/params`    | (SK Paradigm) This is a SvelteKit specific folder to add validation on parameter based routes |            |
| `/routes`    | (SK Paradigm) File System based routing                                                       |            |
| `/state`     | Global State containers and resolvers                                                         | $state     |
| `/styles`    | CSS                                                                                           |
| `/themes`    | Dynamically Added Themes (this may move and be reworked)                                      | $themes    |
| `/utilities` | Global Utility functions                                                                      | $utilities |
