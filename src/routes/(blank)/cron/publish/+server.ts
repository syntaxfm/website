import { env } from '$env/dynamic/private';
import { db } from '$server/db/client';
import { content } from '$server/db/schema';
import { error, json } from '@sveltejs/kit';
import { and, eq, lte, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const cron_secret = env.CRON_SECRET;
	if (!cron_secret) {
		error(500, 'CRON_SECRET is not configured');
	}

	const provided_secret = request.headers.get('x-cron-secret') || url.searchParams.get('secret');
	if (provided_secret !== cron_secret) {
		error(401, 'Invalid cron secret');
	}

	const now = new Date();

	const promoted_rows = await db
		.update(content)
		.set({
			status: 'PUBLISHED',
			updated_at: now,
			published_at: sql`coalesce(${content.published_at}, now())`
		})
		.where(and(eq(content.status, 'DRAFT'), lte(content.published_at, now)))
		.returning({ id: content.id });

	return json({
		success: true,
		promoted_count: promoted_rows.length,
		promoted_ids: promoted_rows.map((row) => row.id)
	});
};
