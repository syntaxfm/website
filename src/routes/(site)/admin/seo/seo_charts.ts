import type {
	DomainOverview,
	GoogleSearchCheck,
	SearchDemand,
	SeoReport,
	YoutubeSearchCheck
} from '$server/seo_tracker/seo_report';

// View models for the SEO dashboard's charts

export type SnapshotSummary = {
	taken_at: Date;
	overview: DomainOverview | null;
	referring_domains: number | null;
	// 0 to 1; null before snapshots had search volumes
	niche_visibility: number | null;
	google_searches: GoogleSearchCheck[];
	youtube_searches: YoutubeSearchCheck[];
};

export type StatTile = {
	label: string;
	value: number | null;
	format: 'count' | 'percent';
	// Against the snapshot before; null with only one snapshot
	change: number | null;
	// Oldest first, one value per snapshot that had it
	trend: number[];
};

const TILE_METRICS: {
	label: string;
	format: StatTile['format'];
	read: (summary: SnapshotSummary) => number | null;
}[] = [
	{ label: 'Niche visibility', format: 'percent', read: (summary) => summary.niche_visibility },
	{
		label: 'Google keywords',
		format: 'count',
		read: (summary) => summary.overview?.keyword_count ?? null
	},
	{
		label: 'Visits a month (estimate)',
		format: 'count',
		read: (summary) => summary.overview?.estimated_traffic ?? null
	},
	{
		label: 'On page 1',
		format: 'count',
		read: ({ overview }) =>
			overview ? overview.bands.pos_1 + overview.bands.pos_2_3 + overview.bands.pos_4_10 : null
	},
	{
		label: 'In the top 3',
		format: 'count',
		read: ({ overview }) => (overview ? overview.bands.pos_1 + overview.bands.pos_2_3 : null)
	},
	{ label: 'Sites linking here', format: 'count', read: (summary) => summary.referring_domains }
];

export function build_stat_tiles(newest_first: readonly SnapshotSummary[]): StatTile[] {
	const oldest_first = [...newest_first].reverse();
	return TILE_METRICS.map(({ label, format, read }) => {
		const values = oldest_first.map(read);
		const latest = values.at(-1) ?? null;
		const previous = values.length > 1 ? (values.at(-2) ?? null) : null;
		return {
			label,
			format,
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

// YouTube search terms by views, with the watch hours each brought beside the bar
export function search_term_rows(
	terms: readonly { term: string; views: number; minutes_watched: number | null }[]
): BarRow[] {
	return terms.map((term) => ({
		key: term.term,
		label: term.term,
		value: term.views,
		value_text: term.views.toLocaleString(),
		detail: term.minutes_watched === null ? undefined : `${Math.round(term.minutes_watched / 60)} h`
	}));
}

// Where a position sits along a #1…#max track, as a percentage from the left. The scale is
// logarithmic, so #1–10 get as much room as #10–100: that's where moves matter.
export function position_percent(position: number, max: number): number {
	const clamped = Math.min(Math.max(position, 1), max);
	return (Math.log(clamped) / Math.log(max)) * 100;
}

export type TrackedPlacement = {
	position: number | null;
	url: string | null;
	title: string | null;
};

export type TrackedRow = {
	search: string;
	demand: SearchDemand | null;
	google: TrackedPlacement;
	youtube: TrackedPlacement;
	// Oldest first, one per snapshot that tracked the search (null: not found that time)
	google_history: (number | null)[];
	youtube_history: (number | null)[];
};

function history_of(
	oldest_first: readonly SnapshotSummary[],
	search: string,
	read: (summary: SnapshotSummary) => readonly { search: string; syntax_position: number | null }[]
): (number | null)[] {
	return oldest_first.flatMap((summary) => {
		const check = read(summary).find((candidate) => candidate.search === search);
		return check ? [check.syntax_position] : [];
	});
}

// One row per search tracked in the latest snapshot, with its position history
export function build_tracked_rows(
	report: Pick<SeoReport, 'google_searches' | 'youtube_searches' | 'demand'>,
	newest_first: readonly SnapshotSummary[]
): TrackedRow[] {
	const oldest_first = [...newest_first].reverse();
	const youtube = new Map(report.youtube_searches.map((check) => [check.search, check]));
	const demand = new Map((report.demand ?? []).map((entry) => [entry.search, entry]));
	return report.google_searches.map((check) => {
		const video = youtube.get(check.search);
		return {
			search: check.search,
			demand: demand.get(check.search) ?? null,
			google: {
				position: check.syntax_position,
				url: check.syntax_url ?? null,
				title: check.syntax_title
			},
			youtube: {
				position: video?.syntax_position ?? null,
				url: video?.syntax_video_url ?? null,
				title: video?.syntax_video_title ?? null
			},
			google_history: history_of(oldest_first, check.search, (summary) => summary.google_searches),
			youtube_history: history_of(oldest_first, check.search, (summary) => summary.youtube_searches)
		};
	});
}

// SVG point runs for a position history: #1 at the top on the same log scale as the track. A
// snapshot where Syntax wasn't found breaks the line.
export function position_history_runs(
	positions: readonly (number | null)[],
	max: number,
	width: number,
	height: number,
	inset = 4
): { x: number; y: number }[][] {
	const step = positions.length > 1 ? (width - inset * 2) / (positions.length - 1) : 0;
	const runs: { x: number; y: number }[][] = [];
	let run: { x: number; y: number }[] = [];
	positions.forEach((position, index) => {
		if (position === null) {
			if (run.length > 0) runs.push(run);
			run = [];
			return;
		}
		run.push({
			x: inset + index * step,
			y: inset + (position_percent(position, max) / 100) * (height - inset * 2)
		});
	});
	if (run.length > 0) runs.push(run);
	return runs;
}
