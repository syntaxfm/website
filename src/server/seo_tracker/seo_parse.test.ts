import { describe, expect, it } from 'vitest';
import backlinks_fixture from './fixtures/backlinks_summary.json';
import competitors_fixture from './fixtures/competitors.json';
import google_fixture from './fixtures/google_organic.json';
import difficulty_fixture from './fixtures/keyword_difficulty.json';
import ranked_fixture from './fixtures/ranked_keywords.json';
import volume_fixture from './fixtures/search_volume.json';
import youtube_fixture from './fixtures/youtube_search.json';
import {
	google_result_site,
	is_channel_video,
	parse_backlinks,
	parse_competitors,
	parse_google_search,
	parse_keyword_difficulty,
	parse_ranked_keywords,
	parse_search_volume,
	parse_view_count,
	parse_youtube_search
} from './seo_parse';

// Fixtures are trimmed real Alexandria responses from 2026-11-15 (search volume and difficulty
// from 2026-11-17)

describe('search demand', () => {
	it('reads volume with its months oldest first', () => {
		const ai_coding = parse_search_volume(volume_fixture).get('ai coding');
		expect(ai_coding?.search_volume).toBe(60500);
		expect(ai_coding?.monthly).toHaveLength(12);
		// November 2025, then October 2026
		expect(ai_coding?.monthly[0]).toBe(22200);
		expect(ai_coding?.monthly.at(-1)).toBe(246000);
	});

	it('reads difficulty by keyword', () => {
		expect(parse_keyword_difficulty(difficulty_fixture).get('ai coding')).toBe(29);
	});
});

const SYNTAX_CHANNEL = { id: 'UCyU5wkjgQYGRB0hIHMwm2Sg', name: 'Syntax' };

describe('parse_ranked_keywords', () => {
	it('reads the domain totals and every ranked keyword', () => {
		const { overview, keywords } = parse_ranked_keywords(ranked_fixture);

		expect(overview).toMatchObject({
			keyword_count: 604,
			bands: { pos_1: 9, pos_2_3: 19, pos_4_10: 63, pos_11_20: 114, pos_21_100: 399 }
		});
		expect(overview?.estimated_traffic).toBeCloseTo(332.23, 1);
		expect(keywords).toHaveLength(3);
		expect(keywords[1]).toEqual({
			keyword: 'maps javascript',
			search_volume: 6600,
			position: 40,
			url: 'https://syntax.fm/videos/syntax-side-dish-explainers/you-should-use-maps-and-sets-in-js',
			keyword_difficulty: 88,
			intent: 'informational',
			has_ai_overview: true
		});
	});

	it('throws when DataForSEO reports a failed task', () => {
		const failed = { tasks: [{ status_code: 40501, status_message: 'Invalid Field' }] };
		expect(() => parse_ranked_keywords(failed)).toThrow('DataForSEO task failed (40501)');
	});
});

describe('parse_competitors', () => {
	it('drops the target domain itself', () => {
		const competitors = parse_competitors(competitors_fixture, 'syntax.fm');

		expect(competitors.map((competitor) => competitor.domain)).not.toContain('syntax.fm');
		expect(competitors[0]).toMatchObject({ domain: 'github.com', shared_keywords: 364 });
	});
});

describe('parse_backlinks', () => {
	it('reads the summary counts', () => {
		expect(parse_backlinks(backlinks_fixture)).toEqual({
			rank: 432,
			backlinks: 48336,
			referring_domains: 2323,
			broken_backlinks: 37
		});
	});
});

describe('google_result_site', () => {
	it('uses the domain when Google links straight to the site', () => {
		expect(google_result_site({ domain: 'www.example.com' })).toBe('example.com');
	});

	it('reads the breadcrumb when the link goes through google.com/goto', () => {
		expect(
			google_result_site({ domain: 'google.com', breadcrumb: 'https://podcast.feedspot.com › web' })
		).toBe('podcast.feedspot.com');
	});

	it('falls back to the site name when the breadcrumb has no URL', () => {
		expect(
			google_result_site({
				domain: 'google.com',
				breadcrumb: '40+ comments · 4 years ago',
				website_name: 'Reddit · r/Frontend'
			})
		).toBe('Reddit · r/Frontend');
	});
});

describe('parse_google_search', () => {
	it("finds syntax.fm's organic position behind google.com/goto links", () => {
		const check = parse_google_search('web development podcast', google_fixture, 'syntax.fm');

		expect(check).toMatchObject({
			search: 'web development podcast',
			syntax_position: 1,
			syntax_title: 'Syntax - Web Development Podcast',
			// The fixture's link is a google.com/goto redirect, not the page
			syntax_url: null
		});
		expect(check.result_types).toContain('ai_overview');
		expect(check.top_sites).toEqual(['syntax.fm', 'Reddit · r/Frontend', 'podcast.feedspot.com']);
	});

	it('keeps the organic results in detail, flagging syntax.fm', () => {
		const { top_results } = parse_google_search(
			'web development podcast',
			google_fixture,
			'syntax.fm'
		);

		expect(top_results).toHaveLength(9);
		expect(top_results?.[0]).toEqual({
			position: 1,
			title: 'Syntax - Web Development Podcast',
			url: null,
			domain: 'syntax.fm',
			description:
				'Full Stack Web Developers Wes Bos and Scott Tolinski dive deep into web development, CSS, JavaScript, Frameworks, Typescript, Servers and more.',
			is_syntax: true
		});
		expect(top_results?.slice(1).every((result) => !result.is_syntax)).toBe(true);
		expect(top_results?.map((result) => result.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});

	it('reports no position when syntax.fm is not in the results', () => {
		const check = parse_google_search('web development podcast', google_fixture, 'example.org');
		expect(check.syntax_position).toBeNull();
		expect(check.syntax_title).toBeNull();
	});
});

describe('parse_youtube_search', () => {
	it('counts a collab video, which has no channel id, as the channel’s', () => {
		const check = parse_youtube_search('svelte podcast', youtube_fixture, SYNTAX_CHANNEL);

		expect(check).toMatchObject({
			syntax_position: 3,
			syntax_video_title: 'Modern Svelte Kit - Complete Svelte Kit Course for Beginners',
			syntax_video_url: 'https://www.youtube.com/watch?v=vkXxFfGwPao'
		});
		expect(check.top_channels).toEqual([
			'JavaScript Conferences by GitNation',
			'Maximilian Schwarzmüller',
			'Syntax and Scott Tolinski'
		]);
	});

	it('keeps each video in detail, with its view count as a number', () => {
		const { top_results } = parse_youtube_search('svelte podcast', youtube_fixture, SYNTAX_CHANNEL);

		expect(top_results).toHaveLength(4);
		expect(top_results?.[0]).toEqual({
			position: 1,
			title:
				'Svelte’s Creator Rich Harris on Rethinking Web Dev, Building Svelte & the Power of Tech Conferences',
			url: 'https://www.youtube.com/watch?v=Tvth3_H5N8o',
			video_id: 'Tvth3_H5N8o',
			channel_name: 'JavaScript Conferences by GitNation',
			channel_handle: '@JavaScriptConferences',
			view_count: 14344,
			length_text: '30:05',
			published_text: '1 year ago',
			// The fixture's text, which has a non-breaking space
			description_snippet: youtube_fixture.videos[0].description_snippet,
			is_syntax: false
		});
		expect(top_results?.map((result) => result.is_syntax)).toEqual([false, false, true, false]);
	});

	it('throws when the response has no video list', () => {
		expect(() => parse_youtube_search('svelte podcast', {}, SYNTAX_CHANNEL)).toThrow(
			'no video list'
		);
	});
});

describe('is_channel_video', () => {
	it('matches by channel id when there is one', () => {
		expect(is_channel_video({ channel_id: SYNTAX_CHANNEL.id }, SYNTAX_CHANNEL)).toBe(true);
		expect(is_channel_video({ channel_id: 'other', channel_name: 'Syntax' }, SYNTAX_CHANNEL)).toBe(
			false
		);
	});

	it('matches collab names on either side, but not other channels named like it', () => {
		const by_name = (channel_name: string) =>
			is_channel_video({ channel_id: null, channel_name }, SYNTAX_CHANNEL);
		expect(by_name('Syntax and Scott Tolinski')).toBe(true);
		expect(by_name('Wes Bos and Syntax')).toBe(true);
		expect(by_name('Syntax Error Podcast')).toBe(false);
	});
});

describe('parse_view_count', () => {
	it.each([
		['14,344 views', 14344],
		['1 view', 1],
		['No views', 0],
		['1.2M views', null],
		['', null],
		[null, null]
	])('reads %j as %j', (text, expected) => {
		expect(parse_view_count(text)).toBe(expected);
	});
});
