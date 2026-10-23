# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `pnpm dev` - Start development server with preheat script
- `pnpm build` - Build production application (runs svelte build + file copying)
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

- **Frontend**: SvelteKit with Svelte 5, TypeScript
- **Backend**: Node.js with SvelteKit server-side rendering
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
├── server/            # Server-side logic and utilities
├── state/             # Svelte stores for client state
├── styles/            # CSS architecture with themes
├── actions/           # Svelte actions
└── utilities/         # Shared utilities
```

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

- Advanced web audio player with offline support
- Media Session API integration
- Position saving and resume functionality
- Service worker for offline playback

### Search System

- Client-side search using FlexSearch
- Web workers for non-blocking search
- Fuzzy search across shows, guests, and transcripts

### Admin Dashboard

- Role-based access control
- Content management for shows and guests
- AI content generation tools
- Transcript management

### Performance Optimization

- Redis caching for database queries
- IndexedDB for offline data storage
- Aggressive caching strategies
- Service worker for offline functionality

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

```typescript
// For complex state, use classes
class PlayerState {
	currentShow = $state<Show | null>(null);
	isPlaying = $state(false);

	play() {
		this.isPlaying = true;
	}
}

export const playerState = new PlayerState();
```

### Database Queries

```typescript
// Use the cached prisma client
import { prisma } from '$server/prisma-client';

// Cache database queries
const shows = await prisma.show.findMany({
	where: { show_type: 'TASTY' },
	orderBy: { number: 'desc' }
});
```

### Component Structure

```svelte
<script lang="ts">
	import { playerState } from '$state/player.svelte';

	let { show } = $props<{ show: Show }>();
	let isPlaying = $derived(playerState.currentShow?.id === show.id);
</script>

<div class="show-card">
	<h3>{show.title}</h3>
	<button onclick={() => playerState.play(show)}>
		{isPlaying ? 'Pause' : 'Play'}
	</button>
</div>
```

Remember to follow the existing code conventions and patterns when adding new features or modifying existing code.
