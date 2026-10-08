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
		dispatchEvent: vi.fn(),
		play: vi.fn().mockResolvedValue(undefined),
		pause: vi.fn().mockResolvedValue(undefined)
	} as unknown as YoutubeVideoElementLike & { isConnected: boolean };
}

function create_mock_container(top = 100, bottom = 300, width = 400) {
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

function register(
	show_number: number,
	video_el: YoutubeVideoElementLike,
	container_el = create_mock_container(),
	is_show_page = false
) {
	return youtube_player.register_embed({ show_number, video_el, container_el, is_show_page });
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

	it('plays the inline embed when it is in view', async () => {
		const inline_el = create_mock_video(0);
		const unregister = register(790, inline_el);

		await youtube_player.start_show(show_790, 30);

		const state = get(youtube_player);
		expect(state.active_show?.number).toBe(790);
		expect(state.status).toBe('PLAYING');
		expect(state.in_mini_player).toBe(false);
		expect(state.active_element).toBe(inline_el);
		expect(inline_el.currentTime).toBe(30);
		expect(inline_el.play).toHaveBeenCalled();

		unregister();
	});

	it('plays in the mini-player when the embed is hidden (zero size)', async () => {
		const hidden_el = create_mock_video(0);
		const unregister = register(790, hidden_el, create_mock_container(0, 0, 0));

		await youtube_player.start_show(show_790);

		const state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.active_element).toBeNull();
		expect(hidden_el.play).not.toHaveBeenCalled();

		unregister();
	});

	it('show page: pops out when scrolled away and docks back when scrolled into view', () => {
		const inline_el = create_mock_video(42.5);
		const mini_el = create_mock_video(42.5);
		const unregister = register(790, inline_el, undefined, true);

		youtube_player.set_playing(show_790, inline_el);
		expect(get(youtube_player).origin_element).toBe(inline_el);

		inline_el.currentTime = 65;
		youtube_player.set_embed_visibility(inline_el, false);
		// The resulting pause event from the inline element must not pause playback
		youtube_player.set_paused(790, inline_el);

		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.status).toBe('PLAYING');
		expect(state.current_time).toBe(65);
		expect(inline_el.pause).toHaveBeenCalled();

		youtube_player.attach_mini_player(mini_el);
		mini_el.currentTime = 95.5;

		youtube_player.set_embed_visibility(inline_el, true);

		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.status).toBe('PLAYING');
		expect(state.active_element).toBe(inline_el);
		expect(state.current_time).toBe(95.5);
		expect(mini_el.pause).toHaveBeenCalled();

		unregister();
	});

	it('list card: keeps the mini-player when scrolled back into view until the card is played', async () => {
		const card_el = create_mock_video(10);
		const mini_el = create_mock_video(10);
		const unregister = register(790, card_el);

		youtube_player.set_playing(show_790, card_el);
		card_el.currentTime = 30;
		youtube_player.set_embed_visibility(card_el, false);
		youtube_player.attach_mini_player(mini_el);
		mini_el.currentTime = 50;

		// Scrolling the card back into view doesn't take playback back
		youtube_player.set_embed_visibility(card_el, true);
		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.active_element).toBe(mini_el);

		// The card's Play button moves playback back into the card from the mini-player's position
		await youtube_player.start_show(show_790);
		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.active_element).toBe(card_el);
		expect(card_el.currentTime).toBe(50);
		expect(mini_el.pause).toHaveBeenCalled();

		unregister();
	});

	it('keeps the mini-player going across navigation and hands off between episodes', () => {
		const show_page_el = create_mock_video(50);
		const mini_el = create_mock_video(50);

		const unregister_show_page = register(790, show_page_el, undefined, true);
		youtube_player.set_playing(show_790, show_page_el);

		// Navigate from /show/790 to /shows
		show_page_el.currentTime = 72;
		youtube_player.before_navigate();
		show_page_el.isConnected = false;
		unregister_show_page();
		youtube_player.after_navigate();

		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.status).toBe('PLAYING');
		expect(state.current_time).toBe(72);
		expect(state.origin_element).toBeNull();

		youtube_player.attach_mini_player(mini_el);
		mini_el.currentTime = 110;

		// A card for the same episode scrolling into view doesn't hijack the mini-player
		const card_790_el = create_mock_video(0);
		youtube_player.dock_to_inline(790, card_790_el);
		expect(get(youtube_player).in_mini_player).toBe(true);

		// Playing that card continues from the mini-player's position
		youtube_player.set_playing(show_790, card_790_el);
		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.origin_element).toBe(card_790_el);
		expect(state.current_time).toBe(110);
		expect(card_790_el.currentTime).toBe(110);
		expect(mini_el.pause).toHaveBeenCalled();

		// Playing a different episode starts it fresh
		youtube_player.enter_mini_player_from_scroll(790, card_790_el);
		const card_760_el = create_mock_video(0);
		youtube_player.set_playing(show_760, card_760_el);

		state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.active_show?.number).toBe(760);
		expect(state.origin_element).toBe(card_760_el);
		expect(state.current_time).toBe(0);
	});

	it('the show page embed takes over playback of its episode when it mounts', async () => {
		const mini_el = create_mock_video(0);
		await youtube_player.start_show(show_790, 20);
		youtube_player.attach_mini_player(mini_el);
		mini_el.currentTime = 40;

		const show_page_el = create_mock_video(0);
		const unregister = register(790, show_page_el, undefined, true);

		const state = get(youtube_player);
		expect(state.in_mini_player).toBe(false);
		expect(state.active_element).toBe(show_page_el);
		expect(state.current_time).toBe(40);

		unregister();
	});

	it('pauses without restarting and resumes from the same position', async () => {
		const inline_el = create_mock_video(0);
		const unregister = register(790, inline_el, undefined, true);
		await youtube_player.start_show(show_790, 120);

		inline_el.currentTime = 185;
		youtube_player.pause();

		let state = get(youtube_player);
		expect(state.status).toBe('PAUSED');
		expect(state.current_time).toBe(185);
		expect(inline_el.pause).toHaveBeenCalled();

		await youtube_player.play();
		state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(inline_el.currentTime).toBe(185);
		expect(inline_el.play).toHaveBeenCalledTimes(2);

		unregister();
	});

	it('resuming with nothing mounted opens the mini-player', async () => {
		const inline_el = create_mock_video(0);
		const unregister = register(790, inline_el);
		await youtube_player.start_show(show_790, 10);
		inline_el.currentTime = 30;
		youtube_player.pause();

		// Navigated away while paused
		inline_el.isConnected = false;
		unregister();

		await youtube_player.play();
		const state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(state.in_mini_player).toBe(true);
		expect(state.current_time).toBe(30);
	});

	it('minimizes, dismisses, and resumes minimized', async () => {
		const mini_el = create_mock_video(60);

		await youtube_player.start_show(show_790, 60);
		youtube_player.attach_mini_player(mini_el);

		let state = get(youtube_player);
		expect(state.in_mini_player).toBe(true);
		expect(state.is_minimized).toBe(false);

		youtube_player.toggle_minimize();
		expect(get(youtube_player).is_minimized).toBe(true);
		expect(get(youtube_player).status).toBe('PLAYING');
		youtube_player.toggle_minimize();
		expect(get(youtube_player).is_minimized).toBe(false);

		mini_el.currentTime = 95;
		youtube_player.dismiss_mini_player();
		state = get(youtube_player);
		expect(state.status).toBe('PAUSED');
		expect(state.is_minimized).toBe(true);
		expect(state.is_dismissed).toBe(true);
		expect(state.current_time).toBe(95);
		expect(mini_el.pause).toHaveBeenCalled();

		await youtube_player.play();
		state = get(youtube_player);
		expect(state.status).toBe('PLAYING');
		expect(state.in_mini_player).toBe(true);
		expect(state.is_minimized).toBe(true);
		expect(state.is_dismissed).toBe(false);
		expect(mini_el.play).toHaveBeenCalled();
	});
});
