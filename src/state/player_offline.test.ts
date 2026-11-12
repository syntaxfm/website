import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get_device_audio_url, keep_audio_on_device } from './player_offline';

// Stands in for the browser's Cache: one stored response per address.
class TestCache {
	readonly entries = new Map<string, Response>();

	async match(request: string | Request) {
		return this.entries.get(typeof request === 'string' ? request : request.url)?.clone();
	}

	async put(request: string, response: Response) {
		this.entries.set(request, response);
	}

	async keys() {
		return [...this.entries.keys()].map((url) => new Request(url));
	}

	async delete(request: Request) {
		return this.entries.delete(request.url);
	}
}

let cache: TestCache;
let episode = 0;
// Each test gets addresses nothing else has asked for: a download is only tried once per visit
const next_audio_url = () => `https://example.com/${++episode}.mp3`;

const download = () =>
	new Response('the episode', {
		headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': '11' }
	});

beforeEach(() => {
	cache = new TestCache();
	vi.useRealTimers();
	vi.stubGlobal('caches', { open: async () => cache });
	vi.stubGlobal('navigator', {});
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => download())
	);
});

describe('keep_audio_on_device', () => {
	it('keeps a copy the audio element can play', async () => {
		const audio_url = next_audio_url();

		await keep_audio_on_device(audio_url);

		const device_url = await get_device_audio_url(audio_url);
		expect(device_url).toMatch(/^blob:/);
		expect(await (await cache.match(audio_url))?.text()).toBe('the episode');
	});

	it('downloads an episode once, however often it is asked', async () => {
		const audio_url = next_audio_url();

		await Promise.all([keep_audio_on_device(audio_url), keep_audio_on_device(audio_url)]);
		await keep_audio_on_device(audio_url);

		expect(fetch).toHaveBeenCalledOnce();
	});

	it('downloads nothing for an episode the listener already saved', async () => {
		const audio_url = next_audio_url();
		cache.entries.set(audio_url, download());

		await keep_audio_on_device(audio_url);

		expect(fetch).not.toHaveBeenCalled();
	});

	it('holds on to the newest three it kept and everything the listener saved', async () => {
		vi.useFakeTimers();
		const saved_by_listener = next_audio_url();
		cache.entries.set(saved_by_listener, download());
		const kept = [next_audio_url(), next_audio_url(), next_audio_url(), next_audio_url()];

		for (const [index, audio_url] of kept.entries()) {
			vi.setSystemTime(new Date(2026, 0, 1 + index));
			await keep_audio_on_device(audio_url);
		}

		expect([...cache.entries.keys()]).toEqual([saved_by_listener, ...kept.slice(1)]);
	});

	it.each([
		['asked their browser to save data', { saveData: true }],
		['is on a phone network', { type: 'cellular' }]
	])('downloads nothing for a listener who %s', async (_, connection) => {
		vi.stubGlobal('navigator', { connection });

		await keep_audio_on_device(next_audio_url());

		expect(fetch).not.toHaveBeenCalled();
	});

	it('keeps nothing when the device has no room for it', async () => {
		vi.stubGlobal('navigator', { storage: { estimate: async () => ({ quota: 100, usage: 95 }) } });

		await keep_audio_on_device(next_audio_url());

		expect(cache.entries.size).toBe(0);
	});

	it('keeps nothing when the download fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('gone', { status: 404 }))
		);

		await keep_audio_on_device(next_audio_url());

		expect(cache.entries.size).toBe(0);
	});
});

describe('get_device_audio_url', () => {
	it('has nothing to play for an episode the device has no copy of', async () => {
		expect(await get_device_audio_url(next_audio_url())).toBeNull();
	});
});
