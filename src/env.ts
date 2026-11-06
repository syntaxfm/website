import { defineEnvVars } from '@sveltejs/kit/env';

// Every variable is optional: a missing one reads as undefined (as $env/dynamic/private did), so
// builds and tests run without secrets and each caller decides what a missing value means.
// Locally, varlock loads them from .env.schema + 1Password; on Cloudflare they are Worker vars/secrets.
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
	YOUTUBE_API_KEY: { schema: optional },
	DEEPGRAM_SECRET: { schema: optional },
	POSTGRES_DATABASE_URL: { schema: optional },
	DATABASE_URL: { schema: optional },
	NODE_ENV: { schema: optional },
	OPENAI_API_KEY: { schema: optional },
	ANTHROPIC_KEY: { schema: optional },
	PUBLIC_URL: { public: true, static: true },
	CONVERT_KIT_SECRET: { schema: optional },
	MEGAPHONE_API_TOKEN: { schema: optional },
	MEGAPHONE_NETWORK_ID: { schema: optional },
	MEGAPHONE_PODCAST_ID: { schema: optional },
	CRON_SECRET: { schema: optional },
	CONVERT_KIT_V4_API_KEY: { schema: optional },
	TURNSTILE_SECRET: { schema: optional },
	// Development only: browser-facing origins the request alone doesn't show, such as an HTTPS
	// proxy's `https://dev.example`. The same setting @syntaxfm/auth-local reads (see vite.config.ts).
	SYNTAX_AUTH_PUBLIC_ORIGINS: { schema: optional },
	PUBLIC_TURNSTILE_SITE_KEY: { public: true, schema: optional }
});
