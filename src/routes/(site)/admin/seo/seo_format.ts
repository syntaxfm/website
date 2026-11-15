// Display text for the SEO dashboard

export function format_position(position: number | null): string {
	return position === null ? '–' : `#${position}`;
}

// A position change from one snapshot to the next. Lower is better, so moving from #8 to #5 is up 3.
export function format_position_move(
	from: number | null,
	to: number | null,
	was_tracked = true
): string {
	if (!was_tracked) return '';
	if (from === null && to === null) return '';
	if (from === null) return 'new';
	if (to === null) return 'dropped';
	if (from === to) return '';
	return from > to ? `▲ ${from - to}` : `▼ ${to - from}`;
}

export function format_change(change: number | null): string {
	if (change === null || Math.round(change) === 0) return '';
	const rounded = Math.round(change);
	return rounded > 0 ? `+${rounded.toLocaleString()}` : rounded.toLocaleString();
}

export function format_count(value: number | null): string {
	return value === null ? '–' : Math.round(value).toLocaleString();
}

// Google result types worth knowing about: an AI answer above the links, or video results
export function format_result_types(result_types: readonly string[]): string {
	const labels: string[] = [];
	if (result_types.includes('ai_overview')) labels.push('AI Overview');
	if (result_types.includes('video') || result_types.includes('short_videos')) {
		labels.push('Videos');
	}
	return labels.join(' · ');
}

// The path of a syntax.fm URL, which is all that differs between rows
export function format_page(url: string): string {
	try {
		const { pathname } = new URL(url);
		return pathname;
	} catch {
		return url;
	}
}
