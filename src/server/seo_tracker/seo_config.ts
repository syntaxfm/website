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

// Searches checked on both Google and YouTube on every snapshot, chosen 2026-11-17 for the mission
// "Videos and Podcasts about Development and AI Engineering". People search the topic, not
// "podcast" ("web development podcast" gets 30 US searches a month), so most are topics. US monthly
// Google searches and difficulty (0-100) from DataForSEO are in the comments.
export const TRACKED_SEARCHES = [
	// AI engineering
	'claude code', // 550k, 100
	'vibe coding', // 110k, 35
	'ai coding', // 60.5k, 29
	'mcp server', // 60.5k, 34
	'local llm', // 40.5k, 24
	'codex cli', // 33.1k, 26
	'ai engineering', // 22.2k, 42
	'best ai for coding', // 9.9k, 20
	'cursor vs claude code', // 8.1k, 2
	'ai coding agents', // 8.1k, 30
	'context engineering', // 4.4k, 41
	'agentic coding', // 2.9k, 12
	// Development
	'web development', // 301k, 61
	'node.js', // 90.5k, 25
	'typescript', // 27.1k, 67
	'frontend development', // 3.6k, 46
	'full stack development', // 1.3k, 37
	'javascript frameworks', // 1.3k, 22
	// Podcast and brand
	'ai podcast', // 5.4k, 37
	'tech podcast', // 1.6k, 8
	'syntax podcast', // 320, 43
	'coding podcast' // 140, 4
] as const;
