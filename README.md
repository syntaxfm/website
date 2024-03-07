# Syntax.

A tasty treats podcast for Web Developers.

This is the site that runs [Syntax.fm](https://syntax.fm) — go there to listen to it!

This site is built on SvelteKit.

## Requirements

- Node 18.0.0 or higher

## Prerequisite

* Install Node - https://nodejs.org/en
* Install pnpm - https://pnpm.io/installation
  * If you are on a Mac, there is an issue with the curl install.
  * Preferably, use homebrew to install:
    * `brew install pnpm`
* Install mysql or use docker with the provided `docker-compose.yml` file.

This site uses MySQL via Prisma, so you will need a valid MySQL connection string.

## Getting Started

1. Read Prerequisites above ^^ before starting
1. Copy `.env.example` to `.env` and specify env variables (needs at least `DATABASE_URL`)
    * If using Docker, add the following at the top of your `.env` file to share variables with the `docker-compose.yml` (replace the existing DATABASE_URL with the one below)
      ```sh
      # required to run the seed commands within the container
      DOCKER=true
      # any value other than "true" is considered false
      DATABASE_HOST=localhost
      DATABASE_PORT=3306
      DATABASE_USER=syntax
      DATABASE_PASSWORD=syntax
      DATABASE_NAME=syntax
      DATABASE_ROOT_PASSWORD=syntax
      DATABASE_URL=mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
      ```
1. If using docker, in a separate tab run -> `docker compose up`
1. Run -> `pnpm preheat`
1. Run -> `pnpm db:push`
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
