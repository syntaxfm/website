import type { Show } from '@prisma/client';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { player } from './player';

vi.mock('./player_offline', () => ({
	get_cached_or_network_show: async (show: Show) => show
}));
vi.mock('./player_utils', () => ({
	load_state_from_indexed_db: async () => null,
	open_db: vi.fn(),
	STORE_NAME: 'player_state'
}));
vi.mock('./media_timeline', async (import_original) => ({
	...(await import_original<typeof import('./media_timeline')>()),
	get_saved_position: () => 45
}));

const show = { number: 9999, url: 'https://example.test/episode.wav', youtube_url: null } as Show;

describe('player initialization', () => {
	beforeEach(() => {
		vi.stubGlobal('HTMLElement', class {});
		player.reset();
		player.update((state) => ({
			...state,
			audio: { src: '', currentTime: 0, pause: vi.fn() } as unknown as HTMLAudioElement,
			media_controller: {} as HTMLAudioElement
		}));
	});

	afterEach(() => vi.unstubAllGlobals());

	it('keeps a preloaded episode initial so its first page Play can apply a shared timestamp', async () => {
		await player.initialize(show);
		const state = get(player);
		expect(state.current_show).toEqual(show);
		expect(state.audio?.currentTime).toBe(45);
		expect(state.status).toBe('INITIAL');
	});

	it('still marks an explicitly loaded saved position as paused', async () => {
		await player.load_show(show, false, 63);
		expect(get(player).audio?.currentTime).toBe(63);
		expect(get(player).status).toBe('PAUSED');
	});
});
