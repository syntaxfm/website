import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Show } from '$server/db/types';
import type { PlayerShow } from './player_utils';

const { metrics_count, device_copies, keep_audio_on_device, remembered, connection } = vi.hoisted(
	() => ({
		metrics_count: vi.fn(),
		// Audio addresses the device has a copy of, and the address each copy plays from
		device_copies: new Map<string, string>(),
		keep_audio_on_device: vi.fn(),
		// What an earlier visit left in IndexedDB
		remembered: { state: null as { current_show: PlayerShow } | null },
		connection: { is_limited: false }
	})
);

vi.mock('@sentry/sveltekit', () => ({ metrics: { count: metrics_count } }));
vi.mock('$utilities/media/load_media_session', () => ({ load_media_session: vi.fn() }));
vi.mock('./player_offline', () => ({
	get_device_audio_url: async (audio_url: string) => device_copies.get(audio_url) ?? null,
	is_on_limited_data: () => connection.is_limited,
	keep_audio_on_device
}));
vi.mock('./player_utils', () => ({
	STORE_NAME: 'player_state',
	// Never settles, so the fire-and-forget IndexedDB save stays out of the way.
	open_db: () => new Promise(() => {}),
	load_state_from_indexed_db: async () => remembered.state
}));

import { audio_timeline_time, player } from './player';
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

function attach_audio(listened_seconds = 0) {
	const audio = {
		src: '',
		preload: '',
		currentTime: 0,
		playbackRate: 1,
		paused: false,
		played: { length: 1, start: () => 0, end: () => listened_seconds },
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

	it('downloads none of the audio while the page loads', async () => {
		const audio = attach_audio();

		await player.initialize(show);
		await settle();

		expect(audio.preload).toBe('none');
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

describe('player audio kept on the device', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
		device_copies.clear();
		keep_audio_on_device.mockReset();
		remembered.state = null;
		connection.is_limited = false;
		player.reset();
	});

	it("plays the device's copy and still knows the show by its real address", async () => {
		device_copies.set(show.url, 'blob:device-copy');
		const audio = attach_audio();

		await player.initialize(show);
		await settle();

		expect(audio.src).toBe('blob:device-copy');
		expect(audio.preload).toBe('metadata');
		expect(get(player).current_show?.url).toBe(show.url);
	});

	it('frees the copy it was playing when another show takes over', async () => {
		device_copies.set(show.url, 'blob:device-copy');
		attach_audio();
		await player.initialize(show);
		await settle();

		await player.start_show({ ...show, number: 901, url: 'https://example.com/901.mp3' });

		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:device-copy');
	});

	it('falls back to the latest show when the remembered one points at a copy that is gone', async () => {
		remembered.state = { current_show: { ...show, number: 850, url: 'blob:gone' } };
		const audio = attach_audio();

		await player.initialize(show);
		await settle();

		expect(audio.src).toBe(show.url);
		expect(get(player).current_show?.number).toBe(900);
	});

	it('keeps the audio once someone has listened for half a minute', async () => {
		attach_audio(31);
		await player.start_show(show);

		player.ontimeupdate();

		expect(keep_audio_on_device).toHaveBeenCalledWith(show.url);
	});

	it('keeps nothing for someone who only samples the episode', async () => {
		attach_audio(12);
		await player.start_show(show);

		player.ontimeupdate();

		expect(keep_audio_on_device).not.toHaveBeenCalled();
	});

	// Half a minute in, the player keeps the audio and gets the copy ready to play from
	async function listen_until_kept() {
		keep_audio_on_device.mockImplementation(async () => {
			device_copies.set(show.url, 'blob:device-copy');
		});
		player.ontimeupdate();
		await settle();
	}

	it('asks for the audio to be kept once, however long the listening goes on', async () => {
		attach_audio(31);
		await player.start_show(show);

		player.ontimeupdate();
		player.ontimeupdate();
		await settle();
		player.ontimeupdate();

		expect(keep_audio_on_device).toHaveBeenCalledOnce();
	});

	it('plays on from the network when the copy lands, so nothing is heard', async () => {
		const audio = attach_audio(31);
		await player.start_show(show);

		await listen_until_kept();

		expect(audio.src).toBe(show.url);
	});

	it("moves to the device's copy at a pause, at the same spot and speed", async () => {
		const audio = attach_audio(31);
		await player.start_show(show);
		await listen_until_kept();
		Object.assign(audio, { currentTime: 95, playbackRate: 1.5, paused: true });

		player.onpause();

		expect(audio.src).toBe('blob:device-copy');
		expect(audio.preload).toBe('metadata');
		expect(audio.currentTime).toBe(95);
		expect(audio.playbackRate).toBe(1.5);
		expect(audio.play).toHaveBeenCalledOnce();
		expect(get(player).current_show?.url).toBe(show.url);
	});

	it("keeps playing through a jump, from the device's copy", async () => {
		const audio = attach_audio(31);
		await player.start_show(show);
		await listen_until_kept();
		audio.currentTime = 1500;

		player.onseeking();
		player.onseeking();

		expect(audio.src).toBe('blob:device-copy');
		expect(audio.currentTime).toBe(1500);
		expect(audio.play).toHaveBeenCalledTimes(2);
		expect(get(player).status).toBe('PLAYING');
	});

	it('moves to the copy that lands while the show sits paused', async () => {
		const audio = attach_audio(31);
		await player.start_show(show);
		audio.paused = true;

		await listen_until_kept();

		expect(audio.src).toBe('blob:device-copy');
	});

	it('stays on the network at a pause when no copy was kept', async () => {
		const audio = attach_audio(31);
		await player.start_show(show);
		player.ontimeupdate();
		await settle();
		audio.paused = true;

		player.onpause();

		expect(audio.src).toBe(show.url);
	});

	it('lets go of a waiting copy when another show takes over', async () => {
		const audio = attach_audio(31);
		await player.start_show(show);
		await listen_until_kept();

		await player.start_show({ ...show, number: 901, url: 'https://example.com/901.mp3' });
		player.onpause();

		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:device-copy');
		expect(audio.src).toBe('https://example.com/901.mp3');
	});
});

describe('player.warm_audio', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		device_copies.clear();
		remembered.state = null;
		connection.is_limited = false;
		player.reset();
	});

	it('reads the start of the loaded audio', async () => {
		const audio = attach_audio();
		await player.initialize(show);
		await settle();

		player.warm_audio();

		expect(audio.preload).toBe('metadata');
	});

	it('reads nothing for a listener on limited data', async () => {
		connection.is_limited = true;
		const audio = attach_audio();
		await player.initialize(show);
		await settle();

		player.warm_audio();

		expect(audio.preload).toBe('none');
	});

	it('reads nothing for a show that plays as video', async () => {
		const audio = attach_audio();
		await player.initialize({
			...show,
			youtube_url: 'https://www.youtube.com/watch?v=dj6tUUTDXAo'
		});
		await settle();

		player.warm_audio();

		expect(audio.preload).toBe('none');
	});
});

describe('audio_timeline_time', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		player.reset();
	});

	it('follows the audio every frame while it plays, and stops when it pauses', async () => {
		const frames: FrameRequestCallback[] = [];
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
			frames.push(callback)
		);
		vi.stubGlobal('cancelAnimationFrame', () => frames.splice(0));
		const audio = attach_audio();
		await player.start_show(show);

		const seen: (number | null)[] = [];
		const unsubscribe = audio_timeline_time.subscribe((time) => seen.push(time));
		audio.currentTime = 12;
		frames.shift()?.(0);
		audio.currentTime = 13;
		frames.shift()?.(0);
		expect(seen.at(-1)).toBe(13);

		player.update((state) => ({ ...state, status: 'PAUSED' }));
		expect(frames).toHaveLength(0);
		unsubscribe();
	});
});
