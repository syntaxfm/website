import { describe, expect, it } from 'vitest';
import { llms_txt, type LlmsTxtInput } from './llms_txt';

const input: LlmsTxtInput = {
	site_url: 'https://syntax.fm',
	episode_count: 950,
	latest_episodes: [
		{
			number: 950,
			title: 'Hot [Takes]',
			slug: 'hot-takes',
			description: 'Wes and Scott\nshare hot takes.',
			has_transcript: true
		},
		{ number: 949, title: 'Potluck', slug: 'potluck', description: null, has_transcript: false }
	],
	topics: [{ name: 'CSS', slug: 'css', count: 120 }]
};

describe('llms_txt', () => {
	it('starts with the name and a summary, as llmstxt.org asks', () => {
		const lines = llms_txt(input).split('\n');

		expect(lines[0]).toBe('# Syntax');
		expect(lines[2]).toMatch(/^> .*950 episodes/);
	});

	it('lists episodes on one line each, with a transcript link when there is one', () => {
		const text = llms_txt(input);

		expect(text).toContain(
			'- [#950: Hot \\[Takes\\]](https://syntax.fm/show/950/hot-takes): Wes and Scott share hot takes. [Transcript](https://syntax.fm/show/950/hot-takes/transcript)'
		);
		expect(text).toContain('- [#949: Potluck](https://syntax.fm/show/949/potluck)\n');
	});

	it('links topic pages', () => {
		expect(llms_txt(input)).toContain('- [CSS](https://syntax.fm/tags/css): 120 items');
	});
});
