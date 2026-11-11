import { describe, expect, it } from 'vitest';
import {
	get_autoplay_embed_url_from_id,
	get_id_from_url,
	get_seconds_from_iso_duration,
	get_watch_url_from_url
} from './utils';

describe('YouTube URL utilities', () => {
	it.each([
		['https://www.youtube.com/watch?v=dj6tUUTDXAo', 'dj6tUUTDXAo'],
		['https://youtu.be/lYXYmcDjGMA', 'lYXYmcDjGMA'],
		['https://www.youtube.com/live/hZCBtPDe8-g', 'hZCBtPDe8-g'],
		['https://www.youtube.com/watch/pMwTR2KeuaU', 'pMwTR2KeuaU'],
		['https://www.youtube.com/embed/dj6tUUTDXAo?rel=0', 'dj6tUUTDXAo'],
		['dj6tUUTDXAo', 'dj6tUUTDXAo']
	])('gets the video id from %s', (url, id) => {
		expect(get_id_from_url(url)).toBe(id);
	});

	it.each([null, undefined, '', 'https://syntax.fm'])('has no video id for %s', (url) => {
		expect(get_id_from_url(url)).toBe('');
	});

	it('normalizes watch urls', () => {
		expect(get_watch_url_from_url('https://youtu.be/lYXYmcDjGMA')).toBe(
			'https://www.youtube.com/watch?v=lYXYmcDjGMA'
		);
		expect(get_watch_url_from_url('https://www.youtube.com/live/hZCBtPDe8-g')).toBe(
			'https://www.youtube.com/watch?v=hZCBtPDe8-g'
		);
		expect(get_watch_url_from_url(null)).toBe('');
	});
});

describe('get_autoplay_embed_url_from_id', () => {
	it('plays with sound when the visitor asked for it', () => {
		expect(get_autoplay_embed_url_from_id('dj6tUUTDXAo')).toBe(
			'https://www.youtube-nocookie.com/embed/dj6tUUTDXAo?autoplay=1&playsinline=1&rel=0'
		);
	});

	it('is muted when it starts by itself', () => {
		expect(get_autoplay_embed_url_from_id('dj6tUUTDXAo', { muted: true })).toBe(
			'https://www.youtube-nocookie.com/embed/dj6tUUTDXAo?autoplay=1&playsinline=1&rel=0&mute=1'
		);
	});
});

describe('get_seconds_from_iso_duration', () => {
	it('reads hours, minutes and seconds', () => {
		expect(get_seconds_from_iso_duration('PT1H2M3S')).toBe(3723);
		expect(get_seconds_from_iso_duration('PT58M')).toBe(3480);
		expect(get_seconds_from_iso_duration('PT45S')).toBe(45);
	});

	it('is 0 for a live stream or a missing length', () => {
		expect(get_seconds_from_iso_duration('P0D')).toBe(0);
		expect(get_seconds_from_iso_duration(undefined)).toBe(0);
	});
});
