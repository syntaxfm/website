import { db } from '$server/db/client';
import { content, show, userSubmission } from '$server/db/schema';
import { and, asc, count, desc, eq, gt, gte, lt, lte } from 'drizzle-orm';

const DAY_MS = 24 * 60 * 60 * 1000;

export const load = async () => {
	const now = new Date();
	const thirty_days_ago = new Date(now.getTime() - 30 * DAY_MS);
	const seven_days_ago = new Date(now.getTime() - 7 * DAY_MS);

	const [pending_submissions_row] = await db
		.select({ value: count() })
		.from(userSubmission)
		.where(eq(userSubmission.status, 'PENDING'));

	const [drafts_row] = await db
		.select({ value: count() })
		.from(content)
		.where(eq(content.status, 'DRAFT'));

	const [scheduled_row] = await db
		.select({ value: count() })
		.from(content)
		.where(and(eq(content.status, 'PUBLISHED'), gt(content.published_at, now)));

	const next_shows = await db.query.show.findMany({
		where: gt(show.date, now),
		orderBy: [asc(show.date)],
		limit: 3,
		columns: {
			id: true,
			number: true,
			title: true,
			slug: true,
			date: true
		}
	});

	const recent_shows = await db.query.show.findMany({
		where: and(gte(show.date, thirty_days_ago), lt(show.date, now)),
		with: {
			transcript: { columns: { id: true } },
			aiShowNote: { columns: { id: true } }
		},
		orderBy: [desc(show.date)],
		columns: {
			id: true,
			number: true,
			title: true,
			slug: true,
			date: true
		}
	});

	const shows_missing_transcript = recent_shows.filter((row) => !row.transcript);
	const shows_missing_ai_notes = recent_shows.filter((row) => row.transcript && !row.aiShowNote);

	const recently_published = await db.query.content.findMany({
		where: and(
			eq(content.status, 'PUBLISHED'),
			gte(content.published_at, seven_days_ago),
			lte(content.published_at, now)
		),
		with: {
			show: { columns: { number: true, slug: true } },
			video: { columns: { url: true } }
		},
		orderBy: [desc(content.published_at)],
		limit: 10
	});

	return {
		pending_submissions_count: Number(pending_submissions_row?.value ?? 0),
		drafts_count: Number(drafts_row?.value ?? 0),
		scheduled_count: Number(scheduled_row?.value ?? 0),
		next_shows,
		shows_missing_transcript,
		shows_missing_ai_notes,
		recently_published
	};
};
