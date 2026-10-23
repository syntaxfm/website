import type { Show } from '@prisma/client';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { youtube_player, type YoutubeVideoElementLike } from './youtube_player';

function create_mock_video(initial_time = 0) {
	return {
		src: 'https://www.youtube.com/watch?v=dj6tUUTDXAo',
		currentTime: initial_time,
		duration: 3600,
		paused: false,
		isConnected: true,
		loadComplete: Promise.resolve(),
		api: { loadVideoById: vi.fn() },
		dispatchEvent: vi.fn(),
		play: vi.fn().mockResolvedValue(undefined),
		pause: vi.fn().mockResolvedValue(undefined)
	} as unknown as YoutubeVideoElementLike & { isConnected: boolean };
}

function create_mock_slot(top = 100, bottom = 300, width = 400) {
	return {
		isConnected: true,
		getBoundingClientRect: () => ({
			top,
			bottom,
			left: 0,
			right: width,
			width,
			height: bottom - top
		})
	} as unknown as HTMLElement;
}

function register_slot(show_number: number, slot_el = create_mock_slot(), is_show_page = false) {
	return youtube_player.register_slot({ show_number, slot_el, is_show_page });
}

const show_790 = {
	number: 790,
	title: 'State of JS',
	slug: 'state-of-js',
	youtube_url: 'https://www.youtube.com/watch?v=dj6tUUTDXAo'
} as Show;

const show_760 = {
	number: 760,
	title: 'Pro VSCode Setups',
	slug: 'pro-vscode-setups',
	youtube_url: 'https://www.youtube.com/watch?v=VIdM5VSlJVw'
} as Show;

describe('youtube_player store', () => {
	beforeEach(() => {
		youtube_player.close();
	});

	it('first play over a slot starts once the global element mounts', async () => {
		const slot_el = create_mock_slot();
		const unregister = register_slot(790, slot_el);

		await youtube_player.play_in_slot(show_790, slot_el);

		let state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(state.video_id).toBe('dj6tUUTDXAo');
		expect(state.target).toBe('SLOT');
		expect(state.slot_el).toBe(slot_el);

		const el = create_mock_video();
		const unregister_element = youtube_player.register_element(el);

		state = get(youtube_player);
		expect(state.active_element).toBe(el);
		await vi.waitFor(() => expect(el.play).toHaveBeenCalled());

		unregister_element();
		unregister();
	});

	it('prewarms only before anything has loaded, without playing', () => {
		youtube_player.prewarm(show_790);
		youtube_player.prewarm(show_760);

		const state = get(youtube_player);
		expect(state.video_id).toBe('dj6tUUTDXAo');
		expect(state.status).toBe('IDLE');
		expect(state.active_show).toBeNull();
	});

	it('plays a prewarmed video in the same element without switching videos', async () => {
		youtube_player.prewarm(show_790);
		const el = create_mock_video();
		const unregister_element = youtube_player.register_element(el);
		const slot_el = create_mock_slot();
		const unregister = register_slot(790, slot_el);

		await youtube_player.play_in_slot(show_790, slot_el);

		expect(get(youtube_player).video_id).toBe('dj6tUUTDXAo');
		expect(el.play).toHaveBeenCalled();

		unregister();
		unregister_element();
	});

	it('docks when the slot scrolls out of view and stays docked until the card is played', async () => {
		const el = create_mock_video();
		// The element mounts once there's a video to show
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		const slot_el = create_mock_slot();
		const other_slot_el = create_mock_slot();
		const unregister = register_slot(790, slot_el);
		const unregister_other = register_slot(790, other_slot_el);

		await youtube_player.play_in_slot(show_790, slot_el);

		youtube_player.set_slot_visibility(slot_el, false);
		expect(get(youtube_player).target).toBe('DOCK');

		// Another slot for the same episode doesn't take it
		youtube_player.set_slot_visibility(other_slot_el, true);
		expect(get(youtube_player).target).toBe('DOCK');

		// Scrolling back doesn't bring it back
		youtube_player.set_slot_visibility(slot_el, true);
		expect(get(youtube_player).target).toBe('DOCK');

		// Jumping to a timestamp doesn't either
		await youtube_player.start_show(show_790, 300);
		expect(get(youtube_player).target).toBe('DOCK');

		// Playing the card does, continuing from where it is
		el.currentTime = 320;
		await youtube_player.play_in_slot(show_790, slot_el);
		const state = get(youtube_player);
		expect(state.target).toBe('SLOT');
		expect(state.slot_el).toBe(slot_el);
		expect(el.currentTime).toBe(320);
		// Moving never pauses, it's the same element
		expect(el.pause).not.toHaveBeenCalled();

		unregister_other();
		unregister();
		unregister_element();
	});

	it('keeps playing in the dock when the page with the slot goes away', async () => {
		const el = create_mock_video();
		// The element mounts once there's a video to show
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		const slot_el = create_mock_slot();
		const unregister = register_slot(790, slot_el);
		await youtube_player.play_in_slot(show_790, slot_el);

		youtube_player.before_navigate();
		unregister();

		let state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(state.target).toBe('DOCK');
		expect(state.slot_el).toBeNull();
		expect(el.pause).not.toHaveBeenCalled();

		// The episode's show page mounting doesn't take it out of the dock
		const show_page_slot = create_mock_slot();
		const unregister_show_page = register_slot(790, show_page_slot, true);
		state = get(youtube_player);
		expect(state.slot_el).toBeNull();
		expect(state.target).toBe('DOCK');

		unregister_show_page();
		unregister_element();
	});

	it('switches episodes in the same element via video_id', async () => {
		const el = create_mock_video(120);
		// The element mounts once there's a video to show
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		const slot_790 = create_mock_slot();
		const slot_760 = create_mock_slot();
		const unregister_790 = register_slot(790, slot_790);
		const unregister_760 = register_slot(760, slot_760);

		await youtube_player.play_in_slot(show_790, slot_790);
		vi.mocked(el.play).mockClear();
		await youtube_player.play_in_slot(show_760, slot_760);

		let state = get(youtube_player);
		expect(state.active_show?.number).toBe(760);
		expect(state.video_id).toBe('VIdM5VSlJVw');
		expect(state.slot_el).toBe(slot_760);
		expect(state.active_element).toBe(el);
		// The wrapper loads it with loadVideoById, the store doesn't play the old video
		expect(el.play).not.toHaveBeenCalled();
		// Until the new video plays, the element still reports the old one
		expect(youtube_player.find_video(show_760)).toBeNull();
		youtube_player.on_element_pause();
		expect(get(youtube_player).status).toBe('PLAYING');

		youtube_player.on_element_playing();
		expect(el.dispatchEvent).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'durationchange' })
		);
		expect(youtube_player.find_video(show_760)).toBe(el);

		state = get(youtube_player);
		expect(state.status).toBe('PLAYING');

		unregister_760();
		unregister_790();
		unregister_element();
	});

	it('starts from outside a slot: over the slot if in view, otherwise docked', async () => {
		const el = create_mock_video();
		// The element mounts once there's a video to show
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);

		await youtube_player.start_show(show_790);
		expect(get(youtube_player).target).toBe('DOCK');

		const hidden_slot = create_mock_slot(0, 0, 0);
		const unregister_hidden = register_slot(760, hidden_slot);
		await youtube_player.start_show(show_760);
		expect(get(youtube_player).target).toBe('DOCK');
		expect(get(youtube_player).slot_el).toBe(hidden_slot);
		unregister_hidden();

		const visible_slot = create_mock_slot();
		const unregister_visible = register_slot(760, visible_slot);
		await youtube_player.start_show(show_760);
		expect(get(youtube_player).target).toBe('SLOT');
		expect(get(youtube_player).slot_el).toBe(visible_slot);

		unregister_visible();
		unregister_element();
	});

	it('pauses and resumes without restarting', async () => {
		const el = create_mock_video();
		// The element mounts once there's a video to show
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		await youtube_player.start_show(show_790);

		el.currentTime = 95;
		youtube_player.pause();
		let state = get(youtube_player);
		expect(state.status).toBe('PAUSED');
		expect(state.current_time).toBe(95);
		expect(el.pause).toHaveBeenCalled();

		vi.mocked(el.play).mockClear();
		await youtube_player.play();
		state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(el.play).toHaveBeenCalled();
		expect(el.currentTime).toBe(95);

		unregister_element();
	});

	it('pause from YouTube controls updates state', async () => {
		const el = create_mock_video();
		// The element mounts once there's a video to show
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		await youtube_player.start_show(show_790);

		el.currentTime = 30;
		youtube_player.on_element_pause();
		expect(get(youtube_player).status).toBe('PAUSED');
		expect(get(youtube_player).current_time).toBe(30);

		youtube_player.on_element_play();
		expect(get(youtube_player).status).toBe('PLAYING');

		unregister_element();
	});

	it('restarts a video that played to the end', async () => {
		const el = create_mock_video();
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		await youtube_player.start_show(show_790);

		el.currentTime = 3600;
		// The element fires pause, then ended
		youtube_player.on_element_pause();
		youtube_player.on_element_ended();
		expect(get(youtube_player).status).toBe('PAUSED');
		expect(youtube_player.get_current_time()).toBe(0);

		await youtube_player.play();
		expect(el.currentTime).toBe(0);
		expect(el.play).toHaveBeenCalled();

		unregister_element();
	});

	it('hands the show to the failure handler when the video errors', async () => {
		const on_failure = vi.fn();
		youtube_player.on_failure(on_failure);
		const el = create_mock_video();
		youtube_player.prewarm(show_790);
		const unregister_element = youtube_player.register_element(el);
		await youtube_player.start_show(show_790);

		el.currentTime = 42;
		youtube_player.on_element_error();
		expect(on_failure).toHaveBeenCalledWith(show_790, 42);
		expect(get(youtube_player).status).toBe('IDLE');

		unregister_element();
	});

	it('close resets but keeps the dock', () => {
		const dock_el = create_mock_slot();
		const unregister_dock = youtube_player.register_dock(dock_el);
		youtube_player.prewarm(show_790);

		youtube_player.close();

		const state = get(youtube_player);
		expect(state.video_id).toBeNull();
		expect(state.status).toBe('IDLE');
		expect(state.dock_el).toBe(dock_el);

		unregister_dock();
		expect(get(youtube_player).dock_el).toBeNull();
	});
});
