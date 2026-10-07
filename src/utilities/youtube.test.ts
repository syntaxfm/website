import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
import { get_youtube_id, get_youtube_watch_url } from './youtube';

function createMockVideoElement(initialTime = 0): YoutubeVideoElementLike {
	return {
		src: 'https://www.youtube.com/watch?v=dj6tUUTDXAo',
		currentTime: initialTime,
		duration: 3600,
		paused: false,
		autoplay: false,
		config: null,
		isConnected: true,
		play: vi.fn().mockResolvedValue(undefined),
		pause: vi.fn().mockResolvedValue(undefined)
	} as unknown as YoutubeVideoElementLike;
}

function createMockContainer(top = 100, bottom = 300): HTMLElement {
	return {
		isConnected: true,
		getBoundingClientRect: () => ({
			top,
			bottom,
			left: 0,
			right: 400,
			width: 400,
			height: bottom - top
		})
	} as unknown as HTMLElement;
}

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

describe('youtube_player store', () => {
	const show790 = {
		number: 790,
		title: 'State of JS',
		slug: 'state-of-js',
		youtube_url: 'https://www.youtube.com/watch?v=dj6tUUTDXAo'
	};

	const show760 = {
		number: 760,
		title: 'Pro VSCode Setups',
		slug: 'pro-vscode-setups',
		youtube_url: 'https://www.youtube.com/watch?v=VIdM5VSlJVw'
	};

	beforeEach(() => {
		youtube_player.close();
	});

	it('starts in-view inline video when start_show is called and syncs with bottom player', async () => {
		const inlineEl = createMockVideoElement(0);
		const containerEl = createMockContainer(100, 300);
		const syncSpy = vi.fn();

		youtube_player.on_sync_player(syncSpy);
		youtube_player.register_embed(790, inlineEl, containerEl, false);

		await youtube_player.start_show(show790, 30);

		const state = get(youtube_player);
		expect(state.active_show?.number).toBe(790);
		expect(state.status).toBe('PLAYING');
		expect(state.in_mini_player).toBe(false);
		expect(state.active_element).toBe(inlineEl);
		expect(inlineEl.currentTime).toBe(30);
		expect(inlineEl.play).toHaveBeenCalled();
		expect(syncSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'PLAYING',
				element: inlineEl,
				current_time: 30
			})
		);

		youtube_player.unregister_embed(790, inlineEl, false);
	});

	it('opens mini-player when scrolling down on show page or list page and closes when scrolling back into view', () => {
		const inlineEl = createMockVideoElement(42.5);
		const miniPlayerEl = createMockVideoElement(42.5);

		youtube_player.set_playing(show790, inlineEl);

		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.status).toBe('PLAYING');
		expect(state.origin_element).toBe(inlineEl);

		// User scrolls past the inline video
		inlineEl.currentTime = 65.0;
		youtube_player.enter_mini_player_from_scroll(790, inlineEl);
		// Simulated pause event from inlineEl should not mark player as PAUSED
		youtube_player.set_paused(790, inlineEl);

		state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.status).toBe('PLAYING');
		expect(state.current_time).toBe(65.0);
		expect(inlineEl.pause).toHaveBeenCalled();

		// Mini-player mounts and advances time
		youtube_player.set_active_element(miniPlayerEl);
		miniPlayerEl.currentTime = 95.5;

		// User scrolls back so origin inlineEl is in view again
		youtube_player.dock_to_inline(790, inlineEl);

		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.status).toBe('PLAYING');
		expect(state.current_time).toBe(95.5);
		expect(inlineEl.currentTime).toBe(95.5);
		expect(inlineEl.play).toHaveBeenCalled();
	});

	it('keeps mini-player going on list pages (/ or /shows), closes on other video play, and resumes from saved point on same video play', () => {
		const showPageEl = createMockVideoElement(50);
		const miniPlayerEl = createMockVideoElement(50);

		youtube_player.register_show_page(790, showPageEl);
		youtube_player.set_playing(show790, showPageEl);

		// Navigate from /show/790/state-of-js to /shows (where 790 is in the list)
		showPageEl.currentTime = 72;
		youtube_player.before_navigate();
		(showPageEl as { isConnected: boolean }).isConnected = false;
		youtube_player.unregister_embed(790, showPageEl, true);
		youtube_player.after_navigate();

		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.status).toBe('PLAYING');
		expect(state.current_time).toBe(72);
		expect(state.origin_element).toBeNull();

		// Mini-player continues playing on /shows and reaches 110s
		youtube_player.set_active_element(miniPlayerEl);
		miniPlayerEl.currentTime = 110;

		// A card for 790 in /shows scrolling into view must NOT hijack the mini-player since it is not origin_element
		const card790El = createMockVideoElement(0);
		youtube_player.dock_to_inline(790, card790El);
		expect(get(youtube_player).in_mini_player).toBe(true);

		// Clicking Play on the SAME episode (790) in the /shows card list closes mini-player and starts from saved point (110s)
		youtube_player.set_playing(show790, card790El);

		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.active_show?.number).toBe(790);
		expect(state.origin_element).toBe(card790El);
		expect(state.current_time).toBe(110);
		expect(card790El.currentTime).toBe(110);
		expect(miniPlayerEl.pause).toHaveBeenCalled();

		// Now scroll card790El out of view on /shows -> pops out mini-player
		youtube_player.enter_mini_player_from_scroll(790, card790El);
		expect(get(youtube_player).in_mini_player).toBe(true);

		// Click Play on a DIFFERENT episode (760) -> closes mini-player and starts 760
		const card760El = createMockVideoElement(0);
		youtube_player.set_playing(show760, card760El);

		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.active_show?.number).toBe(760);
		expect(state.origin_element).toBe(card760El);
		expect(state.current_time).toBe(0);
	});

	it('pauses without restarting and resumes from saved position', async () => {
		const inlineEl = createMockVideoElement(0);
		const containerEl = createMockContainer(100, 300);

		youtube_player.register_embed(790, inlineEl, containerEl, true);
		await youtube_player.start_show(show790, 120);

		expect(get(youtube_player).status).toBe('PLAYING');
		expect(inlineEl.currentTime).toBe(120);

		// Advance video time and click "Playing Episode 790" -> pauses at 185s
		inlineEl.currentTime = 185;
		youtube_player.pause();

		let state = get(youtube_player);
		expect(state.status).toBe('PAUSED');
		expect(state.current_time).toBe(185);
		expect(inlineEl.pause).toHaveBeenCalled();

		// Click "Resume Episode 790" -> plays from 185s without resetting to 0
		youtube_player.play();
		state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(inlineEl.currentTime).toBe(185);
		expect(inlineEl.play).toHaveBeenCalledTimes(2);

		youtube_player.unregister_embed(790, inlineEl, true);
	});

	it('minimizes mini-player while keeping playback going and resumes in minimized state after closing mini-player', async () => {
		const miniPlayerEl = createMockVideoElement(60);

		await youtube_player.start_show(show790, 60);
		youtube_player.set_active_element(miniPlayerEl);

		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.is_minimized).toBe(false);
		expect(state.status).toBe('PLAYING');

		// Minimize mini-player while keeping episode playing
		youtube_player.toggle_minimize();
		state = get(youtube_player);
		expect(state.is_minimized).toBe(true);
		expect(state.status).toBe('PLAYING');

		// Maximize back
		youtube_player.toggle_minimize();
		expect(get(youtube_player).is_minimized).toBe(false);

		// Click x on the mini-player -> pauses and dismisses
		miniPlayerEl.currentTime = 95;
		youtube_player.dismiss_mini_player();
		state = get(youtube_player);
		expect(state.status).toBe('PAUSED');
		expect(state.is_minimized).toBe(true);
		expect(state.is_dismissed).toBe(true);
		expect(state.current_time).toBe(95);
		expect(miniPlayerEl.pause).toHaveBeenCalled();

		// Click play on the bottom player bar -> resumes playing in minimized state
		await youtube_player.play();
		state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(state.in_mini_player).toBe(true);
		expect(state.is_minimized).toBe(true);
		expect(state.is_dismissed).toBe(false);
		expect(miniPlayerEl.play).toHaveBeenCalled();
	});
});


