import { error } from '@sveltejs/kit';
import { desc, sql, type SQL } from 'drizzle-orm';

import { assert_admin_actor, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { seo_snapshot } from '$server/db/schema';
import type {
	Backlinks,
	Competitor,
	DomainOverview,
	GoogleSearchCheck,
	RankedKeyword,
	SearchDemand,
	YoutubeSearchCheck
} from './seo_report';
import { get_seo_topic_names } from './seo_topics';
import {
	build_seo_opportunities,
	build_seo_overview,
	build_seo_search_detail,
	build_seo_search_rows,
	filter_seo_keywords,
	type KeywordFilters,
	type SeoPlatform,
	type SnapshotSummary
} from './seo_views';

// The SEO MCP tools' reads (server/mcp/mcp_tools.ts), admins only. Each reads only the parts of
// the snapshot report it needs, so none loads a whole report (keywords and result detail are most
// of it). None takes a new snapshot or calls DataForSEO: they read what is already stored.

const NO_SNAPSHOT = 'No SEO snapshot has been taken yet.';

type SearchList = 'google_searches' | 'youtube_searches';

/** A tracked-search list without each search's result detail (top_results), in stored order. */
export function searches_without_detail_sql<Check>(list: SearchList): SQL<Check[]> {
	return sql<Check[]>`coalesce((
		select jsonb_agg(search_check.value - 'top_results' order by search_check.position)
		from jsonb_array_elements(${seo_snapshot.report} -> ${list}) with ordinality as search_check(value, position)
	), '[]'::jsonb)`;
}

/** One tracked search's check in a list, or null; `search` is matched exactly. */
function search_check_sql<Check>(list: SearchList | 'demand', search: string): SQL<Check | null> {
	return sql<Check | null>`jsonb_path_query_first(
		${seo_snapshot.report} -> ${list},
		'$[*] ? (@.search == $search)',
		jsonb_build_object('search', ${search}::text)
	)`;
}

/** The latest two snapshots without keywords or result detail, newest first. */
async function read_latest_summaries(): Promise<SnapshotSummary[]> {
	const rows = await db
		.select({
			taken_at: seo_snapshot.taken_at,
			overview: sql<DomainOverview | null>`${seo_snapshot.report} -> 'overview'`,
			backlinks: sql<Backlinks | null>`${seo_snapshot.report} -> 'backlinks'`,
			competitors: sql<
				Competitor[]
			>`coalesce(${seo_snapshot.report} -> 'competitors', '[]'::jsonb)`,
			google_searches: searches_without_detail_sql<GoogleSearchCheck>('google_searches'),
			youtube_searches: searches_without_detail_sql<YoutubeSearchCheck>('youtube_searches'),
			demand: sql<SearchDemand[] | null>`${seo_snapshot.report} -> 'demand'`
		})
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(2);
	if (rows.length === 0) error(404, NO_SNAPSHOT);
	return rows;
}

/** The latest snapshot's keywords Syntax ranks for on Google, and when it was taken. */
async function read_latest_keywords() {
	const [latest] = await db
		.select({
			taken_at: seo_snapshot.taken_at,
			keywords: sql<RankedKeyword[]>`coalesce(${seo_snapshot.report} -> 'keywords', '[]'::jsonb)`
		})
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(1);
	if (!latest) error(404, NO_SNAPSHOT);
	return latest;
}

export async function get_seo_overview(actor: Actor) {
	assert_admin_actor(actor);
	const [latest, previous] = await read_latest_summaries();
	return build_seo_overview(latest, previous ?? null);
}

export async function list_seo_searches(actor: Actor) {
	assert_admin_actor(actor);
	const [latest, previous] = await read_latest_summaries();
	return {
		taken_at: latest.taken_at,
		previous_taken_at: previous?.taken_at ?? null,
		searches: build_seo_search_rows(latest, previous ?? null)
	};
}

export interface SeoSearchInput {
	search: string;
	platform: SeoPlatform;
	history_limit: number;
}

/** One tracked search over the last history_limit snapshots, with its latest results. */
export async function get_seo_search(actor: Actor, input: SeoSearchInput) {
	assert_admin_actor(actor);
	// Tracked searches are stored lowercase (seo_config.ts)
	const search = input.search.trim().toLowerCase();

	const history = await db
		.select({
			taken_at: seo_snapshot.taken_at,
			google: search_check_sql<GoogleSearchCheck>('google_searches', search),
			youtube: search_check_sql<YoutubeSearchCheck>('youtube_searches', search),
			demand: search_check_sql<SearchDemand>('demand', search)
		})
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(input.history_limit);

	const [latest] = history;
	if (!latest) error(404, NO_SNAPSHOT);
	if (!latest.google && !latest.youtube) {
		error(404, `"${input.search}" isn't a tracked search. list_seo_searches lists them.`);
	}

	return build_seo_search_detail(history, latest.demand, input.platform);
}

export type SeoKeywordInput = Omit<KeywordFilters, 'on_topic_only' | 'sort' | 'limit' | 'offset'> &
	Partial<Pick<KeywordFilters, 'on_topic_only' | 'sort' | 'limit' | 'offset'>>;

export async function search_seo_keywords(actor: Actor, input: SeoKeywordInput) {
	assert_admin_actor(actor);
	const filters: KeywordFilters = {
		...input,
		on_topic_only: input.on_topic_only ?? true,
		sort: input.sort ?? 'volume',
		limit: input.limit ?? 25,
		offset: input.offset ?? 0
	};
	const [latest, topic_names] = await Promise.all([
		read_latest_keywords(),
		filters.on_topic_only ? get_seo_topic_names() : Promise.resolve([])
	]);
	return {
		taken_at: latest.taken_at,
		ranked_keyword_count: latest.keywords.length,
		...filter_seo_keywords(latest.keywords, topic_names, filters)
	};
}

export async function list_seo_opportunities(actor: Actor, limit: number) {
	assert_admin_actor(actor);
	const [latest, topic_names] = await Promise.all([read_latest_keywords(), get_seo_topic_names()]);
	return {
		taken_at: latest.taken_at,
		...build_seo_opportunities(latest.keywords, topic_names, limit)
	};
}
