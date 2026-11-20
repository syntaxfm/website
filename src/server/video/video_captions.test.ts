import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$server/db/client', () => ({ db: {} }));
vi.mock('$app/env/private', () => ({}));

import captions_list from './fixtures/captions_list.json';
import {
	build_caption_upload_multipart,
	cues_to_passages,
	parse_srt,
	pick_caption_track,
	pick_caption_track_info
} from './video_captions';

const srt = readFileSync(new URL('./fixtures/captions.srt', import.meta.url), 'utf8');

describe('parse_srt', () => {
	it('reads each caption with its times in seconds', () => {
		const cues = parse_srt(srt);
		expect(cues).toHaveLength(40);
		expect(cues[0]).toEqual({
			start: 0.08,
			end: 3.2,
			text: "Hey, what's up? This is Scott with Level"
		});
		expect(cues[1].start).toBe(1.6);
	});

	it('skips empty blocks and joins multi-line captions', () => {
		expect(
			parse_srt(
				'1\n00:00:01,000 --> 00:00:02,500\nhello\nthere\n\n2\n00:00:03,000 --> 00:00:04,000\n\n'
			)
		).toEqual([{ start: 1, end: 2.5, text: 'hello there' }]);
	});
});

describe('cues_to_passages', () => {
	it('joins caption lines into passages that end at a sentence', () => {
		const passages = cues_to_passages(parse_srt(srt));
		expect(passages.length).toBeGreaterThan(1);
		expect(passages.length).toBeLessThan(10);
		expect(passages[0].text.startsWith("Hey, what's up? This is Scott with Level Up Tutts")).toBe(
			true
		);
		for (const passage of passages.slice(0, -1)) expect(passage.text).toMatch(/[.?!]$/);
	});

	it('starts a new passage after a pause', () => {
		const passages = cues_to_passages([
			{ start: 0, end: 2, text: 'one' },
			{ start: 2, end: 4, text: 'two' },
			{ start: 9, end: 10, text: 'three' }
		]);
		expect(passages.map((passage) => passage.text)).toEqual(['one two', 'three']);
	});
});

describe('pick_caption_track', () => {
	it("uses YouTube's automatic English track when no captions were uploaded", () => {
		expect(pick_caption_track(captions_list)).toBe(captions_list.items[0].id);
	});

	it('prefers an uploaded English track', () => {
		const uploaded = {
			...captions_list.items[0],
			id: 'uploaded',
			snippet: { ...captions_list.items[0].snippet, trackKind: 'standard' }
		};
		expect(pick_caption_track({ items: [...captions_list.items, uploaded] })).toBe('uploaded');
	});

	it('finds nothing without an English track', () => {
		const french = {
			...captions_list.items[0],
			snippet: { ...captions_list.items[0].snippet, language: 'fr' }
		};
		expect(pick_caption_track({ items: [french] })).toBe(null);
	});

	it('reports whether the picked track is asr or standard', () => {
		expect(pick_caption_track_info(captions_list)).toEqual({
			id: captions_list.items[0].id,
			kind: 'asr'
		});
		const uploaded = {
			...captions_list.items[0],
			id: 'uploaded',
			snippet: { ...captions_list.items[0].snippet, trackKind: 'standard' }
		};
		expect(pick_caption_track_info({ items: [...captions_list.items, uploaded] })).toEqual({
			id: 'uploaded',
			kind: 'standard'
		});
	});
});

describe('build_caption_upload_multipart', () => {
	it('builds a valid multipart/related body with metadata JSON and SRT payload', () => {
		const body = build_caption_upload_multipart(
			'test-boundary',
			{ snippet: { videoId: 'abc', language: 'en', name: '', isDraft: false } },
			'1\n00:00:00,000 --> 00:00:02,000\nHello Claude Code'
		);
		expect(body).toContain('--test-boundary\r\nContent-Type: application/json; charset=UTF-8');
		expect(body).toContain('"videoId":"abc"');
		expect(body).toContain('--test-boundary\r\nContent-Type: application/octet-stream');
		expect(body).toContain('Hello Claude Code');
		expect(body.endsWith('--test-boundary--\r\n')).toBe(true);
	});
});
