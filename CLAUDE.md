# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `pnpm dev` - Start development server with preheat script
- `pnpm build` - Build production application (`vite build`)
- `pnpm check` - Run TypeScript type checking
- `pnpm lint` - Run prettier + eslint + stylelint
- `pnpm test` - Run Playwright tests
- `pnpm test:unit` - Run Vitest unit tests

### Database Commands

- `pnpm db:studio` - Open Prisma Studio GUI
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed database with test data
- `pnpm i-changed-the-schema` - Shortcut for push + generate after schema changes

### Testing Commands

- `pnpm test:ui` - Run Playwright tests with UI
- `pnpm check:watch` - Run TypeScript check in watch mode

## Project Architecture

### Technology Stack

- **Frontend**: SvelteKit 3 with Svelte 5, TypeScript 6, Vite 8
- **Backend**: Node.js (22.17+) with SvelteKit server-side rendering
- **Database**: MySQL with Prisma ORM (PlanetScale)
- **Caching**: Redis (Upstash)
- **Deployment**: Vercel with Node.js 22.x runtime
- **Monitoring**: Sentry for error tracking

### Key Directory Structure

```
src/
├── routes/
│   ├── (site)/        # Main website layout
│   ├── (blank)/       # Clean layout for embeds
│   └── api/           # API endpoints
├── lib/               # Reusable components
├── server/            # Server-side logic and utilities (server-only)
├── state/             # Svelte stores for client state
├── styles/            # CSS architecture with themes
├── actions/           # Svelte actions
├── utilities/         # Shared utilities (safe on client and server)
├── env.ts             # Declares every environment variable the app reads
└── params.ts          # Route param matchers
```

SvelteKit 3 treats any `server` directory as server-only, so code that client components import (e.g. `src/utilities/transcripts.ts`) must live outside `src/server/`.

### Imports

Paths use `package.json` subpath imports (SvelteKit's `config.alias` is deprecated): `#lib/*`, `#server/*`, `#state/*`, `#utilities/*`, `#actions/*`, `#assets/*`, `#styles/*`, plus `#const` and `#hooks.server`.

- Subpath imports map literally, so include the file extension. Use `.js` for `.ts` files: `import { prisma_client } from '#server/prisma-client.js'`, `import Icon from '#lib/Icon.svelte'`.
- `#` means a fragment in CSS, so CSS `url()`s use relative paths: `url('../assets/Grit Mask@2x.png')`.

### Environment Variables

Every variable must be declared in `src/env.ts` with `defineEnvVars`. Undeclared variables aren't available. Import them from `$app/env/private` (server) or `$app/env/public` (`PUBLIC_` vars). Mark build-time values with `static: true`; runtime ones use a `schema`.

### Database Schema

The application manages podcast content with these key models:

- **Show**: Episodes with metadata, transcripts, AI-generated content
- **User**: GitHub OAuth authentication with role-based access
- **Guest**: Guest profiles with social links and appearances
- **Transcript**: Full transcription with utterances and speaker identification
- **Video**: YouTube integration with playlists
- **UserSubmission**: User-generated content submissions

### Content Management

- Show notes are stored as markdown files in the `/shows/` directory
- AI-generated content (summaries, tweets, show notes) using OpenAI/Anthropic
- Automated transcription via Deepgram
- Multi-layer caching with Redis for performance

## Code Style and Conventions

### Naming Conventions

- **Components**: PascalCase for `.svelte` files (e.g., `ShowCard.svelte`)
- **Variables/Functions**: snake_case for variables, functions, and props
- **Constants**: UPPER_CASE for true constants only
- **Types**: PascalCase for TypeScript interfaces

### Svelte 5 Patterns

- Use `$state` for reactive state declarations
- Use `$derived` for computed values
- Use `$effect` for side effects and lifecycle
- Use `$props` for component props with destructuring
- Use `$bindable` for two-way bindable props
- Use classes for complex state management (state machines)

### CSS Architecture

- CSS variables defined in `src/styles/variables.css`
- Use `bg` and `fg` convention for background/foreground colors
- Custom media queries for responsive design:
  ```css
  @custom-media --below-med (width < 700px);
  @custom-media --above-med (width > 700px);
  ```

### File Organization

- **Components**: Group related components in `/src/lib/`
- **Routes**: Use SvelteKit's file-based routing with layout groups
- **State**: Svelte stores in `/src/state/` for global state
- **Server**: All server-side logic in `/src/server/`

## Key Features

### Audio Player

- Audio player built on media-chrome, which also controls the YouTube player for episodes with video
- Media Session API integration
- Position saving and resume functionality
- Offline episodes saved with the Cache API, player state in IndexedDB

### Search System

- Client-side search using FlexSearch, in a web worker so it doesn't block the page
- Prefix search over episode titles and show notes (`/content.json`)

### Admin Dashboard

- Role-based access control
- Content management for shows and guests
- AI content generation tools
- Transcript management

### Performance Optimization

- Redis caching for database queries
- IndexedDB for offline data storage
- CDN caching via `cache-control` headers on show pages and APIs

## Development Workflow

### Adding New Features

1. Create components in `/src/lib/` for reusable UI
2. Add routes in `/src/routes/` following the layout structure
3. Use Prisma for database operations via `/src/server/prisma-client.ts`
4. Implement caching for database queries using the cache utilities
5. Add proper TypeScript types and error handling

### Database Changes

1. Modify `/prisma/schema.prisma`
2. Run `pnpm i-changed-the-schema` to apply changes
3. Update seed data if needed in `/prisma/seed.ts`

### Testing

- Use Playwright for integration tests
- Use Vitest for unit tests
- Run linting before commits
- Test across different screen sizes and devices

### Deployment

- Application deploys to Vercel automatically
- Environment variables managed through Vercel dashboard
- Database hosted on PlanetScale
- Redis cache on Upstash

## Common Patterns

### State Management

Existing global state (`player`, `youtube_player`, etc.) uses Svelte stores in `src/state/*.ts`. For new complex state, use a class in a `.svelte.ts` file:

```typescript
// src/state/counter.svelte.ts
class Counter {
	count = $state(0);

	increment() {
		this.count += 1;
	}
}

export const counter = new Counter();
```

### Database Queries

```typescript
import { prisma_client } from '#server/prisma-client.js';
import { super_cache_mang } from '#server/cache/cache_mang.js';

// Wrap queries in super_cache_mang to cache them in Redis
const shows = await super_cache_mang('tasty_shows', () =>
	prisma_client.show.findMany({
		where: { show_type: 'TASTY' },
		orderBy: { number: 'desc' }
	})
);
```

### Component Structure

```svelte
<script lang="ts">
	import type { Show } from '@prisma/client';
	import { player } from '#state/player.js';

	let { show }: { show: Show } = $props();
	let is_current = $derived($player.current_show?.number === show.number);
</script>

<div class="show-card">
	<h3>{show.title}</h3>
	<button onclick={() => player.start_show(show)}>
		{is_current ? 'Playing' : 'Play'}
	</button>
</div>
```

Remember to follow the existing code conventions and patterns when adding new features or modifying existing code.
