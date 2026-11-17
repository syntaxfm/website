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

// 0.041 → "4.1%"
export function format_percent(share: number | null): string {
	if (share === null) return '–';
	const percent = share * 100;
	return `${percent >= 10 || percent === 0 ? Math.round(percent) : percent.toFixed(1)}%`;
}

// A change in a 0–1 share, in percentage points: 0.006 → "+0.6 pts"
export function format_share_change(change: number | null): string {
	if (change === null) return '';
	const points = Math.round(change * 1000) / 10;
	if (points === 0) return '';
	return `${points > 0 ? '+' : ''}${points} pts`;
}

const COMPACT = new Intl.NumberFormat('en-US', {
	notation: 'compact',
	maximumSignificantDigits: 3
});

// Searches a month, short: 60500 → "60.5K"
export function format_volume(volume: number | null): string {
	return volume === null ? '–' : COMPACT.format(volume);
}

// How a search's volume moved over the last year: the last 3 months against the first 3.
// Empty when it barely moved or there aren't enough months.
export function format_volume_trend(monthly: readonly number[]): string {
	if (monthly.length < 6) return '';
	const average = (months: readonly number[]) =>
		months.reduce((total, searches) => total + searches, 0) / months.length;
	const before = average(monthly.slice(0, 3));
	const after = average(monthly.slice(-3));
	if (before === 0) return after > 0 ? '↑ new this year' : '';
	const ratio = after / before;
	if (ratio >= 2) return `↑ ${Math.round(ratio * 10) / 10}× this year`;
	if (ratio >= 1.2) return `↑ ${Math.round((ratio - 1) * 100)}% this year`;
	if (ratio <= 0.8) return `↓ ${Math.round((1 - ratio) * 100)}% this year`;
	return '';
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
