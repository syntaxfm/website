import { describe, expect, it } from 'vitest';
import backlinks_fixture from './fixtures/backlinks_summary.json';
import competitors_fixture from './fixtures/competitors.json';
import google_fixture from './fixtures/google_organic.json';
import ranked_fixture from './fixtures/ranked_keywords.json';
import youtube_fixture from './fixtures/youtube_search.json';
import {
	google_result_site,
	is_channel_video,
	parse_backlinks,
	parse_competitors,
	parse_google_search,
	parse_ranked_keywords,
	parse_youtube_search
} from './seo_parse';

// Fixtures are trimmed real Alexandria responses from 2026-11-15

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
			syntax_title: 'Syntax - Web Development Podcast'
		});
		expect(check.result_types).toContain('ai_overview');
		expect(check.top_sites).toEqual(['syntax.fm', 'Reddit · r/Frontend', 'podcast.feedspot.com']);
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
