import { db } from '$server/db/client';
import { seo_snapshot } from '$server/db/schema';
import { run_alexandria_calls, type AlexandriaCall, type AlexandriaOutcome } from './alexandria';
import {
	COMPETITOR_LIMIT,
	GOOGLE_RESULT_DEPTH,
	RANKED_KEYWORD_LIMIT,
	SEO_LANGUAGE_CODE,
	SEO_LOCATION_CODE,
	SEO_TARGET_DOMAIN,
	SYNTAX_YOUTUBE_CHANNEL,
	TRACKED_SEARCHES
} from './seo_config';
import {
	parse_backlinks,
	parse_competitors,
	parse_google_search,
	parse_keyword_difficulty,
	parse_ranked_keywords,
	parse_search_volume,
	parse_youtube_search,
	type SearchVolume
} from './seo_parse';
import type { GoogleSearchCheck, RankedKeyword, SeoCallError, SeoReport } from './seo_report';

type PlannedCall = {
	kind:
		| 'ranked_keywords'
		| 'competitors'
		| 'backlinks'
		| 'search_volume'
		| 'keyword_difficulty'
		| 'google_search'
		| 'youtube_search';
	subject: string;
	call: AlexandriaCall;
};

const PLACE = { location_code: SEO_LOCATION_CODE, language_code: SEO_LANGUAGE_CODE };
const TRACKED_SUBJECT = 'tracked searches';

// The live check only looks at Google's top 20. Past that, a tracked search's position comes from
// the ranked keywords, which cover the top 100.
export function with_top_100_positions(
	checks: readonly GoogleSearchCheck[],
	keywords: readonly RankedKeyword[]
): GoogleSearchCheck[] {
	const ranked = new Map(keywords.map((keyword) => [keyword.keyword.toLowerCase(), keyword]));
	return checks.map((check) => {
		if (check.syntax_position !== null && check.syntax_url) return check;
		const keyword = ranked.get(check.search.toLowerCase());
		// The live position wins; the ranked keyword fills the page Google's link hid
		return keyword
			? {
					...check,
					syntax_position: check.syntax_position ?? keyword.position,
					syntax_url: keyword.url
				}
			: check;
	});
}

export function plan_seo_calls(searches: readonly string[] = TRACKED_SEARCHES): PlannedCall[] {
	return [
		{
			kind: 'ranked_keywords',
			subject: SEO_TARGET_DOMAIN,
			call: {
				provider: 'dataforseo',
				capability: 'domains/ranked-keywords',
				options: {
					target: SEO_TARGET_DOMAIN,
					...PLACE,
					limit: RANKED_KEYWORD_LIMIT,
					order_by: ['keyword_data.keyword_info.search_volume,desc']
				}
			}
		},
		{
			kind: 'competitors',
			subject: SEO_TARGET_DOMAIN,
			call: {
				provider: 'dataforseo',
				capability: 'domains/competitors',
				// +1: the target itself comes back as the first row
				options: {
					target: SEO_TARGET_DOMAIN,
					...PLACE,
					limit: COMPETITOR_LIMIT + 1,
					exclude_top_domains: true
				}
			}
		},
		{
			kind: 'backlinks',
			subject: SEO_TARGET_DOMAIN,
			call: {
				provider: 'dataforseo',
				capability: 'backlinks/summary',
				options: { target: SEO_TARGET_DOMAIN }
			}
		},
		{
			kind: 'search_volume',
			subject: TRACKED_SUBJECT,
			call: {
				provider: 'dataforseo',
				capability: 'keywords/search-volume',
				options: { ...PLACE, keywords: [...searches] }
			}
		},
		{
			kind: 'keyword_difficulty',
			subject: TRACKED_SUBJECT,
			call: {
				provider: 'dataforseo',
				capability: 'keywords/difficulty',
				options: { ...PLACE, keywords: [...searches] }
			}
		},
		...searches.map(
			(search): PlannedCall => ({
				kind: 'google_search',
				subject: search,
				call: {
					provider: 'dataforseo',
					capability: 'serp/google-organic',
					options: { keyword: search, ...PLACE, depth: GOOGLE_RESULT_DEPTH }
				}
			})
		),
		...searches.map(
			(search): PlannedCall => ({
				kind: 'youtube_search',
				subject: search,
				call: {
					provider: 'youtube-com',
					capability: 'videos/search_videos',
					options: { query: search }
				}
			})
		)
	];
}

// Assembles the report from each call's outcome. A failed or unreadable call leaves its section
// empty and is listed in errors, so one bad call doesn't lose the whole snapshot.
export function build_seo_report(
	planned: readonly PlannedCall[],
	outcomes: readonly AlexandriaOutcome[]
): { report: SeoReport; errors: SeoCallError[]; credits_cost: number } {
	if (planned.length !== outcomes.length) {
		throw new Error(`Expected ${planned.length} outcomes, got ${outcomes.length}`);
	}
	const report: SeoReport = {
		version: 1,
		settings: { domain: SEO_TARGET_DOMAIN, ...PLACE },
		overview: null,
		keywords: [],
		competitors: [],
		backlinks: null,
		google_searches: [],
		youtube_searches: []
	};
	const errors: SeoCallError[] = [];
	let credits_cost = 0;
	let volumes: Map<string, SearchVolume> | null = null;
	let difficulties: Map<string, number> | null = null;

	planned.forEach((plan, index) => {
		const outcome = outcomes[index];
		const capability = `${plan.call.provider} ${plan.call.capability}`;
		if (!outcome.ok) {
			errors.push({ capability, subject: plan.subject, ...outcome.error });
			return;
		}
		credits_cost += outcome.credits_cost;
		try {
			if (plan.kind === 'ranked_keywords') {
				const ranked = parse_ranked_keywords(outcome.data);
				report.overview = ranked.overview;
				report.keywords = ranked.keywords;
			} else if (plan.kind === 'competitors') {
				report.competitors = parse_competitors(outcome.data, SEO_TARGET_DOMAIN);
			} else if (plan.kind === 'backlinks') {
				report.backlinks = parse_backlinks(outcome.data);
			} else if (plan.kind === 'search_volume') {
				volumes = parse_search_volume(outcome.data);
			} else if (plan.kind === 'keyword_difficulty') {
				difficulties = parse_keyword_difficulty(outcome.data);
			} else if (plan.kind === 'google_search') {
				report.google_searches.push(
					parse_google_search(plan.subject, outcome.data, SEO_TARGET_DOMAIN)
				);
			} else {
				report.youtube_searches.push(
					parse_youtube_search(plan.subject, outcome.data, SYNTAX_YOUTUBE_CHANNEL)
				);
			}
		} catch (error) {
			errors.push({
				capability,
				subject: plan.subject,
				code: 'unreadable_response',
				message: error instanceof Error ? error.message : String(error)
			});
		}
	});

	report.google_searches = with_top_100_positions(report.google_searches, report.keywords);
	if (volumes || difficulties) {
		const searches = planned.filter((plan) => plan.kind === 'google_search');
		report.demand = searches.map(({ subject }) => {
			const volume = volumes?.get(subject.toLowerCase());
			return {
				search: subject,
				search_volume: volume?.search_volume ?? null,
				keyword_difficulty: difficulties?.get(subject.toLowerCase()) ?? null,
				monthly: volume?.monthly ?? []
			};
		});
	}

	return { report, errors, credits_cost };
}

export async function take_seo_snapshot(
	api_key: string
): Promise<{ id: string; credits_cost: number; error_count: number }> {
	const planned = plan_seo_calls();
	const outcomes = await run_alexandria_calls(
		planned.map((plan) => plan.call),
		api_key
	);
	const { report, errors, credits_cost } = build_seo_report(planned, outcomes);
	const [row] = await db
		.insert(seo_snapshot)
		.values({ credits_cost, report, errors })
		.returning({ id: seo_snapshot.id });
	return { id: row.id, credits_cost, error_count: errors.length };
}
