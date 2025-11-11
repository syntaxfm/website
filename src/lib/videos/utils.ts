export function get_thumbnail_from_id(id: string) {
	return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function get_id_from_url(url: string) {
	// Extract the YouTube video ID from the query parameter v=...
	// Example: https://www.youtube.com/watch?v=7iF0nUVLcU4 -> 7iF0nUVLcU4
	const match = url.match(/[?&]v=([^&#]+)/);
	return match ? match[1] : '';
}
