// YouTube's WebP thumbnails are about half the bytes of its JPEGs (1280 wide: 87 KB vs 202 KB).
const YOUTUBE_THUMBNAIL_BASE = 'https://i.ytimg.com/vi_webp';

export function get_thumbnail_from_id(id: string) {
	return `${YOUTUBE_THUMBNAIL_BASE}/${id}/maxresdefault.webp`;
}

/**
 * The 16:9 picture widths YouTube serves for a video, for `srcset`. sddefault is 640×480 with
 * the 16:9 frame letterboxed inside it, so it only fits a 16:9 box with `object-fit: cover`.
 */
export function get_thumbnail_srcset_from_id(id: string) {
	const base = `${YOUTUBE_THUMBNAIL_BASE}/${id}`;
	return `${base}/mqdefault.webp 320w, ${base}/sddefault.webp 640w, ${base}/maxresdefault.webp 1280w`;
}

function parse_time_to_seconds(time_value: string): number {
	if (/^\d+$/.test(time_value)) {
		return Number.parseInt(time_value, 10);
	}

	const match = time_value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
	if (!match) {
		return 0;
	}

	const hours = Number.parseInt(match[1] || '0', 10);
	const minutes = Number.parseInt(match[2] || '0', 10);
	const seconds = Number.parseInt(match[3] || '0', 10);

	return hours * 3600 + minutes * 60 + seconds;
}

/** The 11 character YouTube video id, or '' when there's no url or it isn't a YouTube video. */
export function get_id_from_url(url: string | null | undefined) {
	if (!url) return '';
	const trimmed_url = url.trim();

	if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed_url)) {
		return trimmed_url;
	}

	try {
		const parsed_url = new URL(trimmed_url);
		const hostname = parsed_url.hostname.replace(/^www\./, '');

		if (hostname === 'youtu.be') {
			return parsed_url.pathname.split('/').filter(Boolean)[0] ?? '';
		}

		if (!hostname.endsWith('youtube.com')) {
			return '';
		}

		if (parsed_url.pathname === '/watch') {
			return parsed_url.searchParams.get('v') ?? '';
		}

		const path_parts = parsed_url.pathname.split('/').filter(Boolean);
		if (['embed', 'shorts', 'live', 'watch', 'v'].includes(path_parts[0])) {
			return path_parts[1] ?? '';
		}
	} catch {
		return '';
	}

	return '';
}

/** A plain watch url, which is what <youtube-video> takes as its src. '' when there's no video. */
export function get_watch_url_from_url(url: string | null | undefined) {
	const video_id = get_id_from_url(url);
	return video_id ? `https://www.youtube.com/watch?v=${video_id}` : '';
}

export function get_embed_url_from_url(url: string) {
	const video_id = get_id_from_url(url);
	if (!video_id) {
		return '';
	}

	const search_params = new URLSearchParams({ rel: '0' });

	try {
		const parsed_url = new URL(url);
		const time_value = parsed_url.searchParams.get('t') ?? parsed_url.searchParams.get('start');

		if (time_value) {
			const start_seconds = parse_time_to_seconds(time_value);
			if (start_seconds > 0) {
				search_params.set('start', String(start_seconds));
			}
		}
	} catch {
		// no-op: URL parsing can fail when the stored value is only a video id
	}

	return `https://www.youtube.com/embed/${video_id}?${search_params.toString()}`;
}

/**
 * The embed url for the plain YouTube iframe, which plays on its own, apart from the site's player.
 * `muted` is what lets a browser start it without a click.
 */
export function get_autoplay_embed_url_from_id(id: string, { muted = false } = {}) {
	const search_params = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0' });
	if (muted) search_params.set('mute', '1');
	return `https://www.youtube-nocookie.com/embed/${id}?${search_params.toString()}`;
}

/** Seconds in a YouTube API duration such as `PT1H2M3S`. 0 when it isn't one (live streams are `P0D`). */
export function get_seconds_from_iso_duration(duration: string | null | undefined) {
	const match = duration?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
	if (!match) return 0;
	const [, hours = '0', minutes = '0', seconds = '0'] = match;
	return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}
