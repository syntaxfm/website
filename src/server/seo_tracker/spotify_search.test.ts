import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { check_spotify_searches, parse_spotify_search, spotify_search_url } from './spotify_search';

// Firecrawl's markdown of open.spotify.com/search/coding%20podcast/podcastAndEpisodes on
// 2026-11-20, logged out, cut before the footer and with long descriptions shortened. A .txt file,
// so Prettier leaves Firecrawl's markdown exactly as it came.
const page = readFileSync(new URL('./fixtures/spotify_search.txt', import.meta.url), 'utf8');

describe('spotify_search_url', () => {
	it("opens the search's podcasts and episodes", () => {
		expect(spotify_search_url('cursor vs claude code')).toBe(
			'https://open.spotify.com/search/cursor%20vs%20claude%20code/podcastAndEpisodes'
		);
	});
});

describe('parse_spotify_search', () => {
	const check = parse_spotify_search('coding podcast', page);

	it('finds Syntax among the episodes but not the shows', () => {
		expect(check).toMatchObject({
			search: 'coding podcast',
			syntax_show_position: null,
			syntax_episode_position: 30,
			syntax_episode_title: '1051: Mourning the Death of Code',
			syntax_episode_url: 'https://open.spotify.com/episode/12g4lXEKt55L5R36tIvGAy',
			top_shows: ['Learn to Code', 'The freeCodeCamp Podcast', 'CodeNewbie']
		});
	});

	it('keeps all 10 shows with their publishers', () => {
		expect(check.show_results).toHaveLength(10);
		expect(check.show_results?.[1]).toEqual({
			position: 2,
			name: 'The freeCodeCamp Podcast',
			url: 'https://open.spotify.com/show/7CpuEnbCLIXwI6LEcbBOYP',
			publisher: 'freeCodeCamp.org',
			is_syntax: false
		});
	});

	it('keeps the first 10 episodes in detail, without markdown escapes', () => {
		expect(check.top_results).toHaveLength(10);
		expect(check.top_results?.[0]).toMatchObject({
			position: 1,
			title: '#501 – DHH: Future of Programming, AI, Agentic Engineering, Vibe Coding & Linux',
			url: 'https://open.spotify.com/episode/45lhw2Adbrsw0xSCOgIeg3',
			show_name: 'Lex Fridman Podcast',
			show_url: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL',
			published_text: 'Aug 26',
			length_text: '5 hr 21 min',
			is_syntax: false
		});
		expect(check.top_results?.[0].description_snippet).toMatch(/^DHH is the creator of Ruby/);
		expect(check.top_results?.[3]).toMatchObject({
			title:
				'Andrew Yang Reacts to His Viral Debates on Artificial Intelligence | Surrounded Follow-Up',
			published_text: 'Wednesday',
			length_text: '33 min 27 sec'
		});
	});

	it('marks Syntax’s show when it is listed', () => {
		const with_syntax = page.replace(
			'[Learn to Code](https://open.spotify.com/show/2dGDlNN7GOqJjy7Qlr3ECF)',
			'[Syntax - Tasty Web Development Treats](https://open.spotify.com/show/4kYCRYJ3yK5DQbP5tbfZby)'
		);
		expect(parse_spotify_search('coding podcast', with_syntax)).toMatchObject({
			syntax_show_position: 1,
			top_shows: ['Syntax - Tasty Web Development Treats', 'The freeCodeCamp Podcast', 'CodeNewbie']
		});
	});

	it('throws on a page with no results, such as a sign-in wall', () => {
		expect(() => parse_spotify_search('coding podcast', '# Log in to Spotify')).toThrow(
			'layout may have changed'
		);
	});
});

describe('check_spotify_searches', () => {
	// Answers the "coding podcast" page and refuses every other
	const fetch_fn = (async (_input: string | URL | Request, init?: RequestInit) => {
		const { url } = JSON.parse(String(init?.body)) as { url: string };
		if (url.includes('coding%20podcast')) {
			return new Response(
				JSON.stringify({
					success: true,
					data: { markdown: page, metadata: { statusCode: 200, creditsUsed: 1 } }
				})
			);
		}
		return new Response('Payment required', { status: 402 });
	}) as typeof fetch;

	it('checks each search, and lists the ones that failed', async () => {
		const result = await check_spotify_searches(
			['coding podcast', 'tech podcast'],
			'key',
			fetch_fn
		);
		expect(result.checks.map((check) => check.search)).toEqual(['coding podcast']);
		expect(result.credits_cost).toBe(1);
		expect(result.errors).toEqual([
			{
				capability: 'firecrawl open.spotify.com/search',
				subject: 'tech podcast',
				code: 'scrape_failed',
				message: 'Firecrawl scrape failed (402): Payment required'
			}
		]);
	});
});
