# Syntax.

A tasty treats podcast for Web Developers.

This is the site that runs [Syntax.fm](https://syntax.fm) — go there to listen to it!

This site is built on SvelteKit.

## Requirements

- Node 18.0.0 or higher

## Prerequisite

Install Node - https://nodejs.org/en

Install pnpm - https://pnpm.io/installation

Install mysql

This site uses MySQL via Prisma, so you will need a valid MySQL connection string.

## Getting Started

1. Read Prerequisites above ^^ before starting
1. Copy `.env.example` to `.env` and specify env variables (needs at least `DATABASE_URL`)
1. Run -> `pnpm preheat`
1. Run -> `pnpm dev`
1. Visit `http://localhost:5173`

### Scripts

Generate Types `pnpm db:generate`
DB studio `pnpm db:studio`
DB Migrations `pnpm db:push`
DB Seed `pnpm db:seed`

### About this codebase

Just about all major code folders live in `/src` with the exception of `/shows` - the md source of truth for all podcast episodes as well as `/prisma` for our db connections and schema.

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
@custom-media --below_small (width < 400px);
@custom-media --below_med (width < 700px);
@custom-media --below_large (width < 900px);
@custom-media --below_xlarge (width < 1200px);
@custom-media --above_small (width > 400px);
@custom-media --above_med (width > 700px);
@custom-media --above_large (width > 900px);
@custom-media --above_xlarge (width > 1200px);

// Usage
@media (--above_med) {
}
```

# Our Contributors

<a href="https://github.com/syntaxfm/website/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=syntaxfm/website" />
</a>
