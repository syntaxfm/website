import { desc, sql } from 'drizzle-orm';

import { FIRECRAWL_API_KEY } from '$app/env/private';
import { assert_admin_actor, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { seo_snapshot } from '$server/db/schema';
import { compare_reports, find_opportunities, niche_visibility } from './seo_compare';
import {
	GOOGLE_MAX_POSITION,
	SPOTIFY_EPISODE_MAX_POSITION,
	SPOTIFY_SHOW_MAX_POSITION,
	YOUTUBE_MAX_POSITION
} from './seo_config';
import { searches_without_detail_sql } from './seo_queries';
import { get_seo_topic_names } from './seo_topics';
import { without_result_detail } from './seo_views';
import type {
	DomainOverview,
	GoogleSearchCheck,
	SearchDemand,
	SpotifySearchCheck,
	YoutubeSearchCheck
} from './seo_report';

// The SEO page's data: the latest snapshot compared with the one before, and the trend lines. The
// admin page (admin_seo.remote.ts) and the MCP endpoint (server/mcp) both call it with the person
// acting.

const HISTORY_LIMIT = 20;

export async function get_seo_dashboard(actor: Actor) {
	assert_admin_actor(actor);

	const history = await db
		.select({
			id: seo_snapshot.id,
			taken_at: seo_snapshot.taken_at,
			credits_cost: seo_snapshot.credits_cost,
			error_count: sql<number>`jsonb_array_length(${seo_snapshot.errors})`,
			// Only the totals and tracked searches, for the trend lines: whole reports are ~30 kB each
			overview: sql<DomainOverview | null>`${seo_snapshot.report} -> 'overview'`,
			referring_domains: sql<
				number | null
			>`(${seo_snapshot.report} -> 'backlinks' ->> 'referring_domains')::integer`,
			// Without each search's result detail (~180 kB a snapshot), which the page doesn't show
			google_searches: searches_without_detail_sql<GoogleSearchCheck>('google_searches'),
			youtube_searches: searches_without_detail_sql<YoutubeSearchCheck>('youtube_searches'),
			spotify_searches: searches_without_detail_sql<SpotifySearchCheck>('spotify_searches'),
			demand: sql<SearchDemand[] | null>`${seo_snapshot.report} -> 'demand'`
		})
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(HISTORY_LIMIT);

	const [latest, previous] = await db
		.select()
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(2);

	const topic_names = latest ? await get_seo_topic_names() : [];

	return {
		is_online: Boolean(FIRECRAWL_API_KEY),
		// Positions are known this deep; past it a search counts as not found
		max_position: {
			google: GOOGLE_MAX_POSITION,
			youtube: YOUTUBE_MAX_POSITION,
			spotify_show: SPOTIFY_SHOW_MAX_POSITION,
			spotify_episode: SPOTIFY_EPISODE_MAX_POSITION
		},
		latest: latest ? { ...latest, report: without_result_detail(latest.report) } : null,
		comparison:
			latest && previous ? compare_reports(previous.report, latest.report, topic_names) : null,
		previous_taken_at: previous?.taken_at ?? null,
		opportunities: latest ? find_opportunities(latest.report.keywords, topic_names) : null,
		history: history.map(({ demand, ...row }) => ({
			...row,
			error_count: Number(row.error_count),
			niche_visibility: niche_visibility({ ...row, demand: demand ?? undefined })
		}))
	};
}
