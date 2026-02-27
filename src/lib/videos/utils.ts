export function get_thumbnail_from_id(id: string) {
	return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
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

export function get_id_from_url(url: string) {
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
		if (path_parts[0] === 'embed' || path_parts[0] === 'shorts' || path_parts[0] === 'live') {
			return path_parts[1] ?? '';
		}
	} catch {
		return '';
	}

	return '';
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
