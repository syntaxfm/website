import { db } from '$server/db/client';
import { seo_snapshot, show, video } from '$server/db/schema';
import { get_id_from_url } from '#lib/videos/utils.ts';
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
	has_channel_video,
	normalize_title,
	parse_backlinks,
	parse_competitors,
	parse_google_search,
	parse_keyword_difficulty,
	parse_ranked_keywords,
	parse_search_volume,
	parse_youtube_search,
	read_youtube_continuation,
	type SearchVolume,
	type SyntaxIdentity
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
		| 'youtube_search'
		| 'youtube_page_two';
	subject: string;
	call: AlexandriaCall;
};

const PLACE = { location_code: SEO_LOCATION_CODE, language_code: SEO_LANGUAGE_CODE };
const TRACKED_SUBJECT = 'tracked searches';

// The live check only looks at Google's first page. Past that, a tracked search's position comes
// from the ranked keywords, which cover syntax.fm in the top 100.
export function with_top_100_positions(
	checks: readonly GoogleSearchCheck[],
	keywords: readonly RankedKeyword[]
): GoogleSearchCheck[] {
	const ranked = new Map(keywords.map((keyword) => [keyword.keyword.toLowerCase(), keyword]));
	return checks.map((check) => {
		const is_site = check.syntax_site === SEO_TARGET_DOMAIN;
		if (check.syntax_position !== null && (check.syntax_url || !is_site)) return check;
		const keyword = ranked.get(check.search.toLowerCase());
		if (!keyword) return check;
		// The live position wins; the ranked keyword fills the page Google's link hid
		return {
			...check,
			syntax_position: check.syntax_position ?? keyword.position,
			syntax_url: keyword.url,
			syntax_site: SEO_TARGET_DOMAIN
		};
	});
}

// YouTube's second page of results for each search whose first page has no Syntax video
export function plan_youtube_page_two(
	planned: readonly PlannedCall[],
	outcomes: readonly AlexandriaOutcome[]
): PlannedCall[] {
	return planned.flatMap((plan, index): PlannedCall[] => {
		const outcome = outcomes[index];
		if (plan.kind !== 'youtube_search' || !outcome?.ok) return [];
		try {
			const continuation = read_youtube_continuation(outcome.data);
			if (!continuation || has_channel_video(outcome.data, SYNTAX_YOUTUBE_CHANNEL)) return [];
			return [
				{
					kind: 'youtube_page_two',
					subject: plan.subject,
					call: { ...plan.call, options: { continuation } }
				}
			];
		} catch {
			// An unreadable first page is reported by build_seo_report
			return [];
		}
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
	outcomes: readonly AlexandriaOutcome[],
	syntax: SyntaxIdentity
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
	const youtube_pages = new Map<string, { first: unknown; second: unknown }>();

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
				report.google_searches.push(parse_google_search(plan.subject, outcome.data, syntax));
			} else if (plan.kind === 'youtube_search') {
				// Read now so an unreadable page is reported here; parsed with its second page below
				parse_youtube_search(plan.subject, [outcome.data], SYNTAX_YOUTUBE_CHANNEL);
				youtube_pages.set(plan.subject, { first: outcome.data, second: null });
			} else {
				parse_youtube_search(plan.subject, [outcome.data], SYNTAX_YOUTUBE_CHANNEL);
				const pages = youtube_pages.get(plan.subject);
				if (pages) pages.second = outcome.data;
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

	for (const [search, { first, second }] of youtube_pages) {
		const pages = second === null ? [first] : [first, second];
		report.youtube_searches.push(parse_youtube_search(search, pages, SYNTAX_YOUTUBE_CHANNEL));
	}
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

// Syntax's episodes and videos, so its YouTube videos count when they show up on Google
async function load_syntax_identity(): Promise<SyntaxIdentity> {
	const [shows, videos] = await Promise.all([
		db.select({ title: show.title, youtube_url: show.youtube_url }).from(show),
		db.select({ id: video.id, title: video.title }).from(video)
	]);
	return {
		domain: SEO_TARGET_DOMAIN,
		channel: SYNTAX_YOUTUBE_CHANNEL,
		video_ids: new Set([
			...videos.map((row) => row.id),
			...shows.map((row) => get_id_from_url(row.youtube_url)).filter(Boolean)
		]),
		titles: new Set([...shows, ...videos].map((row) => normalize_title(row.title)).filter(Boolean))
	};
}

export async function take_seo_snapshot(
	api_key: string
): Promise<{ id: string; credits_cost: number; error_count: number }> {
	const run = (plans: readonly PlannedCall[]) =>
		run_alexandria_calls(
			plans.map((plan) => plan.call),
			api_key
		);
	const first_plans = plan_seo_calls();
	const [first_outcomes, syntax] = await Promise.all([run(first_plans), load_syntax_identity()]);
	const page_two_plans = plan_youtube_page_two(first_plans, first_outcomes);
	const page_two_outcomes = page_two_plans.length > 0 ? await run(page_two_plans) : [];
	const { report, errors, credits_cost } = build_seo_report(
		[...first_plans, ...page_two_plans],
		[...first_outcomes, ...page_two_outcomes],
		syntax
	);
	const [row] = await db
		.insert(seo_snapshot)
		.values({ credits_cost, report, errors })
		.returning({ id: seo_snapshot.id });
	return { id: row.id, credits_cost, error_count: errors.length };
}
