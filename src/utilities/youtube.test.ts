import { describe, expect, it } from 'vitest';
import { get_youtube_id, get_youtube_watch_url } from './youtube';

describe('YouTube URL utilities', () => {
	it('extracts video ID from standard watch URLs', () => {
		expect(get_youtube_id('https://www.youtube.com/watch?v=dj6tUUTDXAo')).toBe('dj6tUUTDXAo');
	});

	it('extracts video ID from youtu.be short URLs', () => {
		expect(get_youtube_id('https://youtu.be/lYXYmcDjGMA')).toBe('lYXYmcDjGMA');
	});

	it('extracts video ID from youtube.com/live/ URLs', () => {
		expect(get_youtube_id('https://www.youtube.com/live/hZCBtPDe8-g')).toBe('hZCBtPDe8-g');
	});

	it('extracts video ID from youtube.com/watch/ URLs', () => {
		expect(get_youtube_id('https://www.youtube.com/watch/pMwTR2KeuaU')).toBe('pMwTR2KeuaU');
	});

	it('returns null for missing or invalid URLs', () => {
		expect(get_youtube_id(null)).toBeNull();
		expect(get_youtube_id(undefined)).toBeNull();
		expect(get_youtube_id('')).toBeNull();
		expect(get_youtube_id('https://syntax.fm')).toBeNull();
	});

	it('normalizes watch URLs', () => {
		expect(get_youtube_watch_url('https://youtu.be/lYXYmcDjGMA')).toBe(
			'https://www.youtube.com/watch?v=lYXYmcDjGMA'
		);
		expect(get_youtube_watch_url('https://www.youtube.com/live/hZCBtPDe8-g')).toBe(
			'https://www.youtube.com/watch?v=hZCBtPDe8-g'
		);
		expect(get_youtube_watch_url(null)).toBeNull();
	});
});
