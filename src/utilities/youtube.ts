const YOUTUBE_ID_REGEX =
	/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;

export function get_youtube_id(url: string | null | undefined): string | null {
	if (!url) return null;
	const match = url.match(YOUTUBE_ID_REGEX);
	return match ? match[1] : null;
}

export function get_youtube_watch_url(url: string | null | undefined): string | null {
	const id = get_youtube_id(url);
	return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
