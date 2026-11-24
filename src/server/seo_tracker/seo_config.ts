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
// Google results checked live per tracked search: its first page (2 credits). Asking for 20 gets a
// different, wrong list: on 2026-11-18 "typescript" had no typescriptlang.org, W3Schools or
// Wikipedia in it, while 10 had typescriptlang.org first. Past the first page, positions come free
// from the ranked keywords, which go to GOOGLE_MAX_POSITION.
export const GOOGLE_RESULT_DEPTH = 10;
export const GOOGLE_MAX_POSITION = 100;
// YouTube search gives about 20 results a page (5 credits). A search with no Syntax video on the
// first page also gets the second, so positions go to about 40. YouTube can't be set to a country:
// on 2026-11-18 "news" gave US networks (NBC, CNN, ABC, Fox) and two Canadian ones.
export const YOUTUBE_MAX_POSITION = 40;

// Syntax's show on Spotify (open.spotify.com/show/…)
export const SYNTAX_SPOTIFY_SHOW_ID = '4kYCRYJ3yK5DQbP5tbfZby';
// Spotify's search page, read logged out through Firecrawl (1 credit), lists the top 10 shows and
// the top 30 episodes in the order the Spotify app shows a new listener. Firecrawl loads it from a
// US address. Spotify's developer API orders results its own way, so it isn't used.
export const SPOTIFY_SHOW_MAX_POSITION = 10;
export const SPOTIFY_EPISODE_MAX_POSITION = 30;

// Searches checked on Google, YouTube and Spotify on every snapshot, chosen 2026-11-17 for the mission
// "Videos and Podcasts about Development and AI Engineering". People search the topic, not
// "podcast" ("web development podcast" gets 30 US searches a month), so most are topics. US monthly
// Google searches and difficulty (0-100) from DataForSEO are in the comments.
export const TRACKED_SEARCH_GROUPS = [
	{
		label: 'AI engineering',
		searches: [
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
			'agentic coding' // 2.9k, 12
		]
	},
	{
		label: 'Development',
		searches: [
			'web development', // 301k, 61
			'node.js', // 90.5k, 25
			'typescript', // 27.1k, 67
			'frontend development', // 3.6k, 46
			'full stack development', // 1.3k, 37
			'javascript frameworks' // 1.3k, 22
		]
	},
	{
		label: 'Podcast and brand',
		searches: [
			'ai podcast', // 5.4k, 37
			'tech podcast', // 1.6k, 8
			'syntax podcast', // 320, 43
			'coding podcast' // 140, 4
		]
	}
] as const satisfies readonly { label: string; searches: readonly string[] }[];

export const TRACKED_SEARCHES: readonly string[] = TRACKED_SEARCH_GROUPS.flatMap(
	(group) => group.searches
);
