import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	UPSPLASH_TOKEN: { static: true },
	UPSPLASH_URL: { static: true },
	YOUTUBE_API_KEY: { static: true },
	PUBLIC_GITHUB_ID: { public: true, static: true },
	GH_SECRET: { static: true },
	PUBLIC_URL: { public: true, static: true },
	CONVERT_KIT_V4_API_KEY: { schema: (input) => input ?? '' },
	CONVERT_KIT_SECRET: { schema: (input) => input ?? '' },
	MEGAPHONE_API_TOKEN: { schema: (input) => input ?? '' },
	MEGAPHONE_NETWORK_ID: { schema: (input) => input ?? '' },
	MEGAPHONE_PODCAST_ID: { schema: (input) => input ?? '' },
	TURNSTILE_SECRET: { schema: (input) => input ?? '' },
	PUBLIC_TURNSTILE_SITE_KEY: { public: true, schema: (input) => input ?? '' }
});
