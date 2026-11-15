import type { RankedKeyword, SeoReport } from './seo_report';

// Smallest position change worth listing: Google positions wobble by one or two week to week
export const MIN_POSITION_MOVE = 3;
// Rows per change list on the dashboard
export const CHANGE_LIST_LIMIT = 20;
// "Striking distance": already on page 1 or 2 but below the top 3, where a better page moves the
// needle most
export const OPPORTUNITY_POSITIONS = { from: 4, to: 20 } as const;
export const MIN_OPPORTUNITY_SEARCH_VOLUME = 20;
export const OPPORTUNITY_LIMIT = 50;

export type KeywordMove = {
	keyword: string;
	search_volume: number | null;
	from: number | null;
	to: number | null;
	url: string;
};

export type SearchMove = {
	search: string;
	from: number | null;
	to: number | null;
	// false when this search wasn't checked in the earlier snapshot
	was_tracked: boolean;
};

export type SeoComparison = {
	keyword_count_change: number | null;
	traffic_change: number | null;
	gained: KeywordMove[];
	lost: KeywordMove[];
	improved: KeywordMove[];
	declined: KeywordMove[];
	google: SearchMove[];
	youtube: SearchMove[];
};

function by_search_volume(a: KeywordMove, b: KeywordMove): number {
	return (b.search_volume ?? 0) - (a.search_volume ?? 0);
}

function search_moves(
	previous: readonly { search: string; syntax_position: number | null }[],
	current: readonly { search: string; syntax_position: number | null }[]
): SearchMove[] {
	const previous_by_search = new Map(previous.map((check) => [check.search, check]));
	return current.map((check) => {
		const before = previous_by_search.get(check.search);
		return {
			search: check.search,
			from: before?.syntax_position ?? null,
			to: check.syntax_position,
			was_tracked: before !== undefined
		};
	});
}

export function compare_reports(previous: SeoReport, current: SeoReport): SeoComparison {
	const previous_keywords = new Map(previous.keywords.map((keyword) => [keyword.keyword, keyword]));
	const current_keywords = new Map(current.keywords.map((keyword) => [keyword.keyword, keyword]));

	const gained: KeywordMove[] = [];
	const improved: KeywordMove[] = [];
	const declined: KeywordMove[] = [];
	for (const keyword of current.keywords) {
		const before = previous_keywords.get(keyword.keyword);
		const move = {
			keyword: keyword.keyword,
			search_volume: keyword.search_volume,
			from: before?.position ?? null,
			to: keyword.position,
			url: keyword.url
		};
		if (!before) gained.push(move);
		else if (before.position - keyword.position >= MIN_POSITION_MOVE) improved.push(move);
		else if (keyword.position - before.position >= MIN_POSITION_MOVE) declined.push(move);
	}

	const lost: KeywordMove[] = previous.keywords
		.filter((keyword) => !current_keywords.has(keyword.keyword))
		.map((keyword) => ({
			keyword: keyword.keyword,
			search_volume: keyword.search_volume,
			from: keyword.position,
			to: null,
			url: keyword.url
		}));

	const top = (moves: KeywordMove[]) => moves.sort(by_search_volume).slice(0, CHANGE_LIST_LIMIT);

	return {
		keyword_count_change:
			previous.overview && current.overview
				? current.overview.keyword_count - previous.overview.keyword_count
				: null,
		traffic_change:
			previous.overview && current.overview
				? current.overview.estimated_traffic - previous.overview.estimated_traffic
				: null,
		gained: top(gained),
		lost: top(lost),
		improved: top(improved),
		declined: top(declined),
		google: search_moves(previous.google_searches, current.google_searches),
		youtube: search_moves(previous.youtube_searches, current.youtube_searches)
	};
}

function normalize_words(text: string): string {
	return ` ${text
		.toLowerCase()
		.replace(/[^a-z0-9.+#]+/g, ' ')
		.trim()} `;
}

// A keyword is on topic when it contains one of Syntax's topic names as whole words, so
// "css grid tutorial" matches the topic "CSS" and "gemma in sons of anarchy" matches nothing.
export function is_on_topic(keyword: string, topic_names: readonly string[]): boolean {
	const words = normalize_words(keyword);
	return topic_names.some((name) => {
		const topic = normalize_words(name);
		return topic.trim().length > 0 && words.includes(topic);
	});
}

export type Opportunities = {
	on_topic: RankedKeyword[];
	off_topic_count: number;
};

// Keywords people search for where syntax.fm is close to the top, highest demand first
export function find_opportunities(
	keywords: readonly RankedKeyword[],
	topic_names: readonly string[]
): Opportunities {
	const candidates = keywords.filter(
		(keyword) =>
			keyword.position >= OPPORTUNITY_POSITIONS.from &&
			keyword.position <= OPPORTUNITY_POSITIONS.to &&
			(keyword.search_volume ?? 0) >= MIN_OPPORTUNITY_SEARCH_VOLUME
	);
	const on_topic = candidates.filter((keyword) => is_on_topic(keyword.keyword, topic_names));
	return {
		on_topic: on_topic
			.sort((a, b) => (b.search_volume ?? 0) - (a.search_volume ?? 0))
			.slice(0, OPPORTUNITY_LIMIT),
		off_topic_count: candidates.length - on_topic.length
	};
}
