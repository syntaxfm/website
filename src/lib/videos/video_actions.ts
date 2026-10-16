import { tick } from 'svelte';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
import get_show_path from '$utilities/slug';

// Actions on the global YouTube video, shared by its own overlay buttons and the player bar's

// The show page's embed can register a little after navigation finishes
const SLOT_RETRY_MS = 100;
const SLOT_RETRIES = 20;

/**
 * Moves the video out of the bar and onto the episode's embed at the top of its show page
 */
export async function open_show_page() {
	const show = get(youtube_player).active_show;
	if (!show) return;
	const path = get_show_path(show);
	if (location.pathname !== path) await goto(path);
	await tick();
	for (let attempt = 0; attempt < SLOT_RETRIES; attempt++) {
		if (await youtube_player.play_on_show_page(show)) return;
		await new Promise((resolve) => setTimeout(resolve, SLOT_RETRY_MS));
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
