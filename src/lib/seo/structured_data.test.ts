import { describe, expect, it } from 'vitest';
import {
	guest_page_schema,
	podcast_episode_schema,
	podcast_series_schema,
	to_json_ld,
	topic_page_schema,
	type EpisodeSchemaShow
} from './structured_data';

const SITE = 'https://syntax.fm';

const episode: EpisodeSchemaShow = {
	number: 900,
	title: 'Is CSS a Programming Language?',
	slug: 'is-css-a-programming-language',
	date: '2025-05-12T11:00:00.000Z',
	url: 'https://traffic.megaphone.fm/FSI900.mp3',
	aiShowNote: {
		description: 'Wes and Scott argue about CSS.',
		links: [{ name: 'MDN', url: 'https://developer.mozilla.org' }]
	},
	guests: [
		{
			guest: {
				name: 'Ben Vinegar',
				name_slug: 'ben-vinegar',
				twitter: 'bentlegen',
				github: 'benvinegar',
				url: null
			}
		}
	],
	hosts: [
		{ profile: { name: 'Wes Bos', username: 'wesbos' } },
		{ profile: { name: 'Scott Tolinski', username: 'stolinski' } }
	],
	meta: {
		updated_at: '2025-06-01T09:00:00.000Z',
		tags: [{ tag: { name: 'CSS', slug: 'css' } }, { tag: { name: 'No slug', slug: null } }]
	}
};

describe('podcast_episode_schema', () => {
	it('points at the canonical episode url', () => {
		const schema = podcast_episode_schema(episode, SITE);

		expect(schema.url).toBe(`${SITE}/show/900/is-css-a-programming-language`);
		expect(schema.episodeNumber).toBe(900);
	});

	it('gives full ISO dates, modified after published', () => {
		const schema = podcast_episode_schema(episode, SITE);

		expect(schema.datePublished).toBe('2025-05-12T11:00:00.000Z');
		expect(schema.dateModified).toBe('2025-06-01T09:00:00.000Z');
	});

	it('never says it was modified before it was published', () => {
		const schema = podcast_episode_schema(
			{ ...episode, meta: { updated_at: '2024-01-01T00:00:00.000Z', tags: [] } },
			SITE
		);

		expect(schema.dateModified).toBe('2025-05-12T11:00:00.000Z');
	});

	it('names hosts as authors and guests as contributors with their profiles', () => {
		const schema = podcast_episode_schema(episode, SITE);

		expect(schema.author).toEqual([
			{ '@type': 'Person', name: 'Wes Bos', sameAs: ['https://github.com/wesbos'] },
			{ '@type': 'Person', name: 'Scott Tolinski', sameAs: ['https://github.com/stolinski'] }
		]);
		expect(schema.contributor).toEqual([
			{
				'@type': 'Person',
				name: 'Ben Vinegar',
				url: `${SITE}/guest/ben-vinegar`,
				sameAs: ['https://x.com/bentlegen', 'https://github.com/benvinegar']
			}
		]);
	});

	it('links topics that have a page, and the links mentioned in the episode', () => {
		const schema = podcast_episode_schema(episode, SITE);

		expect(schema.about).toEqual([{ '@type': 'Thing', name: 'CSS', url: `${SITE}/tags/css` }]);
		expect(schema.mentions).toEqual([
			{ '@type': 'WebPage', name: 'MDN', url: 'https://developer.mozilla.org' }
		]);
	});

	it('leaves out what an episode does not have', () => {
		const schema = podcast_episode_schema(
			{ ...episode, guests: [], aiShowNote: null, meta: null },
			SITE
		);
		const json = JSON.parse(to_json_ld(schema));

		expect(json).not.toHaveProperty('contributor');
		expect(json).not.toHaveProperty('about');
		expect(json).not.toHaveProperty('mentions');
		expect(json).not.toHaveProperty('dateModified');
		expect(json).not.toHaveProperty('subjectOf');
	});

	it('links the transcript page and its Markdown once there is a transcript', () => {
		const schema = podcast_episode_schema({ ...episode, transcript: { show_number: 900 } }, SITE);

		expect(schema.subjectOf).toEqual([
			{
				'@type': 'WebPage',
				name: 'Transcript: Is CSS a Programming Language?',
				url: `${SITE}/show/900/is-css-a-programming-language/transcript`
			},
			{
				'@type': 'DigitalDocument',
				name: 'Transcript: Is CSS a Programming Language?',
				url: `${SITE}/show/900/is-css-a-programming-language/transcript.md`,
				encodingFormat: 'text/markdown'
			}
		]);
	});
});

describe('podcast_series_schema', () => {
	it('describes the show with its feed and hosts', () => {
		const schema = podcast_series_schema(SITE);

		expect(schema['@type']).toBe('PodcastSeries');
		expect(schema.webFeed).toBe('https://feed.syntax.fm');
		expect(schema.author).toHaveLength(2);
		expect(schema.sameAs).not.toContain('https://feed.syntax.fm');
	});
});

describe('to_json_ld', () => {
	it('can never close the script element, and parses back to the same data', () => {
		const schema = { name: '</script><b>Tom & Jerry</b>' };
		const json = to_json_ld(schema);

		expect(json).not.toContain('<');
		expect(json).not.toContain('&');
		expect(JSON.parse(json)).toEqual(schema);
	});
});

describe('topic_page_schema', () => {
	it('lists the episodes with their canonical urls, newest first', () => {
		const schema = topic_page_schema(
			{ name: 'CSS', slug: 'css', description: 'About CSS' },
			[{ number: 900, title: 'CSS', slug: 'css-show' }],
			SITE
		);
		expect(schema.url).toBe(`${SITE}/tags/css`);
		expect(schema.mainEntity).toMatchObject({
			numberOfItems: 1,
			itemListElement: [{ position: 1, item: { url: `${SITE}/show/900/css-show` } }]
		});
	});
});

describe('guest_page_schema', () => {
	it('describes the guest as a person with their profiles and episodes', () => {
		const schema = guest_page_schema(
			episode.guests[0].guest,
			'Ben on Syntax',
			[{ number: 900, title: 'CSS', slug: 'css-show' }],
			SITE
		);
		expect(schema.url).toBe(`${SITE}/guest/ben-vinegar`);
		expect(schema.mainEntity).toMatchObject({
			'@type': 'Person',
			name: 'Ben Vinegar',
			sameAs: ['https://x.com/bentlegen', 'https://github.com/benvinegar'],
			subjectOf: [{ episodeNumber: 900 }]
		});
	});
});
