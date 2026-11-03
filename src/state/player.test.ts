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
import { youtube_player } from './youtube_player';

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
	const audio = {
		src: '',
		currentTime: 0,
		play: vi.fn().mockResolvedValue(undefined),
		pause: vi.fn()
	};
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

describe('player.play_timestamp', () => {
	beforeEach(() => {
		metrics_count.mockReset();
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		player.reset();
	});

	const audio_show: PlayerShow = {
		number: 1012,
		title: 'Episode 1012',
		slug: 'episode-1012',
		url: 'https://example.com/1012.mp3'
	};

	it.each(['LOADED', 'PAUSED'] as const)(
		'seeks then plays the current show when it is %s',
		async (status) => {
			const audio = attach_audio();
			player.update((state) => ({ ...state, current_show: audio_show, status }));

			await player.play_timestamp(audio_show, 44);

			expect(audio.currentTime).toBe(44);
			expect(audio.play).toHaveBeenCalledOnce();
			expect(get(player).status).toBe('PLAYING');
			expect(metrics_count).not.toHaveBeenCalled();
		}
	);

	it('only seeks when the current show is already playing', async () => {
		const audio = attach_audio();
		player.update((state) => ({ ...state, current_show: audio_show, status: 'PLAYING' }));

		await player.play_timestamp(audio_show, 3723);

		expect(audio.currentTime).toBe(3723);
		expect(audio.play).not.toHaveBeenCalled();
		expect(metrics_count).not.toHaveBeenCalled();
	});

	it('starts a different show at the timestamp', async () => {
		const audio = attach_audio();
		player.update((state) => ({
			...state,
			current_show: { ...audio_show, number: 900, url: 'https://example.com/900.mp3' },
			status: 'PLAYING'
		}));

		await player.play_timestamp(audio_show, 44);

		expect(audio.src).toBe(audio_show.url);
		expect(audio.currentTime).toBe(44);
		expect(audio.play).toHaveBeenCalledOnce();
		expect(metrics_count).toHaveBeenCalledWith('episode_start', 1, {
			attributes: { episode: 1012 }
		});
	});
});

describe('player video playback', () => {
	beforeEach(() => {
		metrics_count.mockReset();
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		player.reset();
	});

	const video_show: PlayerShow = {
		number: 790,
		title: 'State of JS',
		slug: 'state-of-js',
		url: 'https://example.com/790.mp3',
		youtube_url: 'https://www.youtube.com/watch?v=dj6tUUTDXAo'
	};

	it('plays the YouTube video for a show that has one', async () => {
		const audio = attach_audio();

		await player.start_show(video_show);

		expect(get(player).media_kind).toBe('VIDEO');
		expect(get(player).current_show?.number).toBe(790);
		expect(get(youtube_player).active_show?.number).toBe(790);
		expect(get(youtube_player).status).toBe('PLAYING');
		expect(audio.play).not.toHaveBeenCalled();
	});

	it('keeps playing the audio for a show someone was partway through listening to', async () => {
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => (key === 'last_played_position_790' ? '120' : null),
			setItem: () => undefined
		});
		const audio = attach_audio();

		await player.start_show(video_show);

		expect(get(player).media_kind).toBe('AUDIO');
		expect(audio.currentTime).toBe(120);
		expect(audio.play).toHaveBeenCalledOnce();
		expect(get(youtube_player).status).toBe('IDLE');
	});
});
