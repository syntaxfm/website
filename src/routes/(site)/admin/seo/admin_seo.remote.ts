import { command, query } from '$app/server';
import { FIRECRAWL_API_KEY } from '$app/env/private';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import { content_tags, seo_snapshot, tag } from '$server/db/schema';
import { compare_reports, find_opportunities } from '$server/seo_tracker/seo_compare';
import { take_seo_snapshot } from '$server/seo_tracker/seo_snapshot';
import { error } from '@sveltejs/kit';
import { count, desc, eq, gte, sql } from 'drizzle-orm';

const HISTORY_LIMIT = 20;
// A tag counts as a Syntax topic (for "on topic" keywords) once this much content uses it
const MIN_TOPIC_CONTENT = 3;

export const get_seo_dashboard = query(async () => {
	await assert_admin();

	const history = await db
		.select({
			id: seo_snapshot.id,
			taken_at: seo_snapshot.taken_at,
			credits_cost: seo_snapshot.credits_cost,
			error_count: sql<number>`jsonb_array_length(${seo_snapshot.errors})`
		})
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(HISTORY_LIMIT);

	const [latest, previous] = await db
		.select()
		.from(seo_snapshot)
		.orderBy(desc(seo_snapshot.taken_at))
		.limit(2);

	const topic_rows = latest
		? await db
				.select({ name: tag.name })
				.from(tag)
				.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
				.groupBy(tag.id, tag.name)
				.having(gte(count(content_tags.content_id), MIN_TOPIC_CONTENT))
		: [];

	return {
		is_online: Boolean(FIRECRAWL_API_KEY),
		latest: latest ?? null,
		comparison: latest && previous ? compare_reports(previous.report, latest.report) : null,
		previous_taken_at: previous?.taken_at ?? null,
		opportunities: latest
			? find_opportunities(
					latest.report.keywords,
					topic_rows.map((row) => row.name)
				)
			: null,
		history: history.map((row) => ({ ...row, error_count: Number(row.error_count) }))
	};
});

export const run_seo_snapshot = command(async () => {
	await assert_admin();
	if (!FIRECRAWL_API_KEY) {
		error(503, 'The SEO tracker is offline: FIRECRAWL_API_KEY is not set');
	}

	try {
		const result = await take_seo_snapshot(FIRECRAWL_API_KEY);
		await get_seo_dashboard().refresh();
		return result;
	} catch (snapshot_error) {
		console.error('SEO snapshot failed', snapshot_error);
		error(
			502,
			snapshot_error instanceof Error ? snapshot_error.message : 'The SEO snapshot failed'
		);
	}
});
