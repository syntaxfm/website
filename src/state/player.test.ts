import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Show } from '$server/db/types';
import type { PlayerShow } from './player_utils';

const { metrics_count } = vi.hoisted(() => ({ metrics_count: vi.fn() }));

vi.mock('@sentry/sveltekit', () => ({ metrics: { count: metrics_count } }));
vi.mock('$utilities/media/load_media_session', () => ({ load_media_session: vi.fn() }));
vi.mock('./player_offline', () => ({
	get_cached_or_network_show: async (show: PlayerShow) => show
}));
vi.mock('./player_utils', () => ({
	STORE_NAME: 'player_state',
	// Never settles, so the fire-and-forget IndexedDB save stays out of the way.
	open_db: () => new Promise(() => {}),
	load_state_from_indexed_db: async () => null
}));

import { player } from './player';

const show: Show = {
	id: 'show-1',
	number: 900,
	title: 'Episode 900',
	slug: 'episode-900',
	date: new Date('2026-01-01T00:00:00Z'),
	url: 'https://example.com/900.mp3',
	youtube_url: null,
	spotify_id: null,
	show_notes: '',
	show_type: 'TASTY',
	hash: 'hash',
	md_file: '/shows/900 - Episode 900.md',
	search_vector: null,
	content_id: null,
	created_at: new Date('2026-01-01T00:00:00Z'),
	updated_at: new Date('2026-01-01T00:00:00Z')
};

describe('player.start_show', () => {
	beforeEach(() => {
		metrics_count.mockReset();
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
	});

	it('records start metrics through the Sentry v10 counter API and starts playing', async () => {
		await player.start_show(show);

		expect(metrics_count).toHaveBeenCalledWith('episode_start', 1, {
			attributes: { episode: 900 }
		});
		expect(metrics_count).toHaveBeenCalledWith('all_episode_start', 1);
		expect(get(player).status).toBe('PLAYING');
	});
});

// initialize() starts load_show without awaiting it, so let that work settle before asserting.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function attach_audio() {
	const audio = { src: '', currentTime: 0, play: vi.fn(), pause: vi.fn() };
	player.update((state) => ({
		...state,
		audio: audio as unknown as HTMLAudioElement,
		media_controller: audio as unknown as HTMLAudioElement
	}));
	return audio;
}

describe('player show input', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		player.reset();
	});

	it('plays a list-card show that has only number, title, slug and url', async () => {
		const audio = attach_audio();
		const card_show: PlayerShow = {
			number: 901,
			title: 'Episode 901',
			slug: 'episode-901',
			url: 'https://example.com/901.mp3'
		};

		await player.start_show(card_show);

		expect(audio.src).toBe('https://example.com/901.mp3');
		expect(audio.play).toHaveBeenCalled();
		expect(get(player).current_show).toEqual(card_show);
	});

	it('loads the latest show on initialize without playing it', async () => {
		const audio = attach_audio();

		await player.initialize(show);
		await settle();

		expect(audio.src).toBe(show.url);
		expect(audio.play).not.toHaveBeenCalled();
		expect(get(player).current_show?.number).toBe(900);
		expect(get(player).status).toBe('LOADED');
	});

	it('leaves the player empty on initialize when there is no latest show', async () => {
		const audio = attach_audio();

		await player.initialize(undefined);
		await settle();

		expect(audio.src).toBe('');
		expect(get(player).current_show).toBeNull();
	});
});
