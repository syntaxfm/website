import { count, desc, eq, gte, sql } from 'drizzle-orm';

import { FIRECRAWL_API_KEY } from '$app/env/private';
import { assert_admin_actor, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { content_tags, guest, seo_snapshot, tag } from '$server/db/schema';
import { compare_reports, find_opportunities, niche_visibility } from './seo_compare';
import { GOOGLE_MAX_POSITION, YOUTUBE_MAX_POSITION } from './seo_config';
import type {
	DomainOverview,
	GoogleSearchCheck,
	SearchDemand,
	YoutubeSearchCheck
} from './seo_report';

// The SEO page's data: the latest snapshot compared with the one before, and the trend lines. The
// admin page (admin_seo.remote.ts) and the MCP endpoint (server/mcp) both call it with the person
// acting.

const HISTORY_LIMIT = 20;
// A tag counts as a Syntax topic (for "on topic" keywords) once this much content uses it
const MIN_TOPIC_CONTENT = 3;

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
			google_searches: sql<GoogleSearchCheck[]>`${seo_snapshot.report} -> 'google_searches'`,
			youtube_searches: sql<YoutubeSearchCheck[]>`${seo_snapshot.report} -> 'youtube_searches'`,
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

	// Syntax's topics and guests, so keyword lists keep "css scroll animations" and "jared palmer"
	// and drop the song lyrics the homepage ranks for
	const [topic_rows, guest_rows] = latest
		? await Promise.all([
				db
					.select({ name: tag.name })
					.from(tag)
					.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
					.groupBy(tag.id, tag.name)
					.having(gte(count(content_tags.content_id), MIN_TOPIC_CONTENT)),
				db.select({ name: guest.name }).from(guest)
			])
		: [[], []];
	const topic_names = [...topic_rows, ...guest_rows].map((row) => row.name);

	return {
		is_online: Boolean(FIRECRAWL_API_KEY),
		// Positions are known this deep; past it a search counts as not found
		max_position: { google: GOOGLE_MAX_POSITION, youtube: YOUTUBE_MAX_POSITION },
		latest: latest ?? null,
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
