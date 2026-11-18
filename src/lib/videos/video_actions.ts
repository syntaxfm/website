import { tick } from 'svelte';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
import { get_media_path } from '$state/player_utils';

// Actions on the global YouTube video, shared by its own overlay buttons and the player bar's

// The show page's embed can register a little after navigation finishes
const SLOT_RETRY_MS = 100;
const SLOT_RETRIES = 20;

/**
 * Moves the video out of the bar and onto the embed at the top of its episode or video page
 */
export async function open_show_page() {
	const show = get(youtube_player).active_show;
	if (!show) return;
	const path = resolve(get_media_path(show));
	if (location.pathname !== path) await goto(path);
	await tick();
	for (let attempt = 0; attempt < SLOT_RETRIES; attempt++) {
		if (await youtube_player.play_on_show_page(show)) return;
		await new Promise((resolve_retry) => setTimeout(resolve_retry, SLOT_RETRY_MS));
	}
	// No embed on the page, the video keeps playing in the bar
}

export function enter_fullscreen() {
	const el = get(youtube_player).active_element as
		| (YoutubeVideoElementLike & { webkitRequestFullscreen?: () => void })
		| null;
	if (!el) return;
	// Safari on iPad only has the prefixed version. iPhone can't full screen anything but <video>.
	if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
	else el.webkitRequestFullscreen?.();
}

/**
 * Attachment for an episode's or video's thumbnail: the global video plays laid over it when it's
 * in view. Returns the cleanup Svelte runs when the element goes away.
 */
export function youtube_slot(media_key: string, is_show_page = false) {
	return (slot_el: HTMLElement) =>
		youtube_player.register_slot({ media_key, slot_el, is_show_page });
}
