import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$server/db/client', () => ({ db: {} }));

import { get_youtube_playlists } from './youtube_api';

describe('get_youtube_playlists', () => {
	it('fails before calling YouTube when YOUTUBE_API_KEY is not set', async () => {
		const fetch_spy = vi.fn();
		vi.stubGlobal('fetch', fetch_spy);

		await expect(get_youtube_playlists()).rejects.toThrow('YOUTUBE_API_KEY must be set');
		expect(fetch_spy).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});
});
