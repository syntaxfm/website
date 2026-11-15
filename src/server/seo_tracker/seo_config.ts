import { YOUTUBE_CHANNEL_ID } from '$const';
import type { YoutubeChannel } from './seo_report';

// Every SEO snapshot uses exactly these settings, so two snapshots differ only because search
// results did. Change them deliberately: comparisons across a change are not like for like.

export const SEO_TARGET_DOMAIN = 'syntax.fm';
// DataForSEO location 2840 = United States
export const SEO_LOCATION_CODE = 2840;
export const SEO_LANGUAGE_CODE = 'en';

// The channel whose position is tracked in YouTube search
export const SYNTAX_YOUTUBE_CHANNEL: YoutubeChannel = { id: YOUTUBE_CHANNEL_ID, name: 'Syntax' };

// The API's maximum per call. syntax.fm ranked for 604 keywords on 2026-11-15.
export const RANKED_KEYWORD_LIMIT = 700;
export const COMPETITOR_LIMIT = 10;
// Google results checked per tracked search (2 credits per 10)
export const GOOGLE_RESULT_DEPTH = 20;

// Searches checked on both Google and YouTube on every snapshot
export const TRACKED_SEARCHES = [
	'web development podcast',
	'web dev podcast',
	'javascript podcast',
	'frontend podcast',
	'css podcast',
	'svelte podcast',
	'react podcast',
	'typescript podcast',
	'node.js podcast',
	'full stack developer podcast',
	'ai coding tools',
	'css tips',
	'javascript tips',
	'web development news',
	'syntax podcast'
] as const;
