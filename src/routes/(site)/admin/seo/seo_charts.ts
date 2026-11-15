import type { DomainOverview } from '$server/seo_tracker/seo_report';

// View models for the SEO dashboard's charts

export type SnapshotSummary = {
	taken_at: Date;
	overview: DomainOverview | null;
	referring_domains: number | null;
};

export type StatTile = {
	label: string;
	value: number | null;
	// Against the snapshot before; null with only one snapshot
	change: number | null;
	// Oldest first, one value per snapshot that had it
	trend: number[];
};

const TILE_METRICS: { label: string; read: (summary: SnapshotSummary) => number | null }[] = [
	{ label: 'Google keywords', read: (summary) => summary.overview?.keyword_count ?? null },
	{
		label: 'Visits a month (estimate)',
		read: (summary) => summary.overview?.estimated_traffic ?? null
	},
	{
		label: 'On page 1',
		read: ({ overview }) =>
			overview ? overview.bands.pos_1 + overview.bands.pos_2_3 + overview.bands.pos_4_10 : null
	},
	{
		label: 'In the top 3',
		read: ({ overview }) => (overview ? overview.bands.pos_1 + overview.bands.pos_2_3 : null)
	},
	{ label: 'Sites linking here', read: (summary) => summary.referring_domains }
];

export function build_stat_tiles(newest_first: readonly SnapshotSummary[]): StatTile[] {
	const oldest_first = [...newest_first].reverse();
	return TILE_METRICS.map(({ label, read }) => {
		const values = oldest_first.map(read);
		const latest = values.at(-1) ?? null;
		const previous = values.length > 1 ? (values.at(-2) ?? null) : null;
		return {
			label,
			value: latest,
			change: latest !== null && previous !== null ? latest - previous : null,
			trend: values.filter((value): value is number => value !== null)
		};
	});
}

// SVG polyline points for a sparkline filling width × height, with `inset` room for the end dot
export function sparkline_points(
	values: readonly number[],
	width: number,
	height: number,
	inset = 5
): { x: number; y: number }[] {
	if (values.length === 0) return [];
	const min = Math.min(...values);
	const max = Math.max(...values);
	const span = max - min;
	const step = values.length > 1 ? (width - inset * 2) / (values.length - 1) : 0;
	return values.map((value, index) => ({
		x: inset + index * step,
		// Higher values sit higher; a flat line sits in the middle
		y: span === 0 ? height / 2 : inset + (1 - (value - min) / span) * (height - inset * 2)
	}));
}

export type BarRow = {
	key: string;
	label: string;
	value: number;
	value_text: string;
	detail?: string;
};

// How many keywords sit in each Google position range, best first
export function position_band_rows(overview: DomainOverview): BarRow[] {
	const bands = [
		{ label: '#1', count: overview.bands.pos_1 },
		{ label: '#2–3', count: overview.bands.pos_2_3 },
		{ label: '#4–10 (rest of page 1)', count: overview.bands.pos_4_10 },
		{ label: '#11–20 (page 2)', count: overview.bands.pos_11_20 },
		{ label: '#21–100', count: overview.bands.pos_21_100 }
	];
	return bands.map((band) => ({
		key: band.label,
		label: band.label,
		value: band.count,
		value_text: band.count.toLocaleString()
	}));
}

// Opportunity keywords as bars of monthly searches, with Syntax's position beside each
export function opportunity_rows(
	keywords: readonly { keyword: string; search_volume: number | null; position: number }[],
	limit: number
): BarRow[] {
	return keywords.slice(0, limit).map((keyword) => ({
		key: keyword.keyword,
		label: keyword.keyword,
		value: keyword.search_volume ?? 0,
		value_text: (keyword.search_volume ?? 0).toLocaleString(),
		detail: `#${keyword.position}`
	}));
}

// Where a position sits along a #1…#max track, as a percentage from the left
export function position_percent(position: number, max: number): number {
	const clamped = Math.min(Math.max(position, 1), max);
	return ((clamped - 1) / (max - 1)) * 100;
}
