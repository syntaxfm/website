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
- Install mysql or use docker with the provided `docker-compose.yml` file.

This site uses MySQL via Prisma, so you will need a valid MySQL connection string.

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
   - If using Docker, add the following at the top of your `.env` file to share variables with the `docker-compose.yml` (replace the existing DATABASE_URL with the one below)
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
     REDIS_PORT=6379
     REDIS_HTTP_PORT=8079
     UPSPLASH_TOKEN=supersecret
     UPSPLASH_URL=http://localhost:${REDIS_HTTP_PORT}
     ```
1. If using docker, in a separate tab run -> `docker compose up`
1. Run -> `pnpm preheat`
1. Run -> `pnpm dev`
1. Visit `http://localhost:5173`

### Scripts

- Generate Types `pnpm db:generate`
- DB studio `pnpm db:studio`
- DB Migrations `pnpm db:push`
- DB Seed `pnpm db:seed`

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
