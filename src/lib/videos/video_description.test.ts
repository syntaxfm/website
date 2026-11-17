import { describe, expect, it } from 'vitest';
import { read_video_description, to_iso_duration } from './video_description';

describe('read_video_description', () => {
	it('keeps the prose and leaves out links and promos', () => {
		const description = [
			'In this video, I talk about the difference between display block and display inline elements.',
			'',
			'In this video series, I teach you how to build your first website.',
			'',
			'The best shared web hosting',
			'http://www.bluehost.com/track/leveluptutorials/',
			'',
			'https://www.patreon.com/leveluptuts',
			'Subscribe to Level Up Pro for extra features!'
		].join('\n');

		expect(read_video_description(description)).toEqual({
			paragraphs: [
				'In this video, I talk about the difference between display block and display inline elements.',
				'In this video series, I teach you how to build your first website.',
				'The best shared web hosting'
			],
			chapters: []
		});
	});

	it('reads three or more timestamps as chapters', () => {
		const { paragraphs, chapters } = read_video_description(
			['We dig into Docker.', '00:00 Intro', '02:15 - Images', '1:03:20 Wrap up'].join('\n')
		);
		expect(paragraphs).toEqual(['We dig into Docker.']);
		expect(chapters).toEqual([
			{ seconds: 0, label: 'Intro' },
			{ seconds: 135, label: 'Images' },
			{ seconds: 3800, label: 'Wrap up' }
		]);
	});

	it('leaves a lone timestamp in the prose', () => {
		const { paragraphs, chapters } = read_video_description('At 2:15 we break it.');
		expect(chapters).toEqual([]);
		expect(paragraphs).toEqual(['At 2:15 we break it.']);
	});
});

describe('to_iso_duration', () => {
	it('writes seconds as an ISO 8601 duration', () => {
		expect(to_iso_duration(276)).toBe('PT4M36S');
		expect(to_iso_duration(3600)).toBe('PT1H');
		expect(to_iso_duration(3723)).toBe('PT1H2M3S');
		expect(to_iso_duration(0)).toBe('PT0S');
	});
});
