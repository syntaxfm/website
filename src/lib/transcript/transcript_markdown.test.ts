import { describe, expect, it } from 'vitest';
import { transcript_markdown } from './transcript_markdown';

const URL = 'https://syntax.fm/show/900/css-is-cool/transcript';

describe('transcript_markdown', () => {
	it('writes a header, the summary, topics and one linked line per passage', () => {
		const markdown = transcript_markdown({
			show_number: 900,
			title: 'CSS is\ncool',
			transcript_url: URL,
			episode_url: 'https://syntax.fm/show/900/css-is-cool',
			published: new Date('2025-06-02T12:00:00Z'),
			description: 'Wes and Scott talk CSS.',
			topics: [{ time: '01:00', text: 'Container queries' }],
			passages: [
				{ start: 2, speaker: 'Wes Bos', text: 'Welcome to Syntax.' },
				{ start: 61.5, speaker: 'Scott Tolinski', text: 'Container\nqueries rule.' },
				{ start: 61.9, speaker: 'Wes Bos', text: 'Agreed.' }
			]
		});

		expect(markdown).toBe(
			[
				'# Transcript: CSS is cool (Syntax #900)',
				'',
				`- Transcript page: ${URL}`,
				'- Episode: https://syntax.fm/show/900/css-is-cool',
				'- Published: 2025-06-02',
				'',
				'> Wes and Scott talk CSS.',
				'',
				`[0:02](${URL}#t-2) **Wes Bos:** Welcome to Syntax.`,
				'',
				'## Container queries (01:00)',
				'',
				`[1:01](${URL}#t-61) **Scott Tolinski:** Container queries rule.`,
				'',
				`[1:01](${URL}#t-61-2) **Wes Bos:** Agreed.`,
				''
			].join('\n')
		);
	});

	it('leaves out the summary when there is none', () => {
		const markdown = transcript_markdown({
			show_number: 1,
			title: 'One',
			transcript_url: URL,
			episode_url: URL,
			published: new Date('2017-06-01T00:00:00Z'),
			description: null,
			topics: [],
			passages: [{ start: 0, speaker: 'Wes Bos', text: 'Hi.' }]
		});
		expect(markdown).not.toContain('>');
	});
});
