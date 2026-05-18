import { getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { content, show, userSubmission } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, asc, count, desc, eq, gt, gte, lt, lte } from 'drizzle-orm';

const DAY_MS = 24 * 60 * 60 * 1000;

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
}

export const get_dashboard = query(async () => {
	assert_admin_user();

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

	const submission_breakdown_rows = await db
		.select({
			submission_type: userSubmission.submission_type,
			value: count()
		})
		.from(userSubmission)
		.where(eq(userSubmission.status, 'PENDING'))
		.groupBy(userSubmission.submission_type)
		.orderBy(desc(count()));

	const submission_breakdown = submission_breakdown_rows.map((row) => ({
		submission_type: row.submission_type,
		count: Number(row.value)
	}));

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

	const shows_missing_transcript = recent_shows
		.filter((row) => !row.transcript)
		.map(({ transcript: _t, aiShowNote: _a, ...rest }) => rest);

	const shows_missing_ai_notes = recent_shows
		.filter((row) => row.transcript && !row.aiShowNote)
		.map(({ transcript: _t, aiShowNote: _a, ...rest }) => rest);

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

	const recent_content_updates = await db.query.content.findMany({
		where: gte(content.updated_at, seven_days_ago),
		with: {
			show: { columns: { number: true, slug: true } },
			video: { columns: { url: true } }
		},
		orderBy: [desc(content.updated_at)],
		limit: 30
	});

	const recent_submissions = await db.query.userSubmission.findMany({
		where: gte(userSubmission.created_at, seven_days_ago),
		orderBy: [desc(userSubmission.created_at)],
		limit: 30,
		columns: {
			id: true,
			name: true,
			submission_type: true,
			status: true,
			created_at: true
		}
	});

	type ContentActivity = {
		kind: 'content';
		timestamp: Date;
		content_id: string;
		content_type: (typeof recent_content_updates)[number]['type'];
		title: string;
		status: (typeof recent_content_updates)[number]['status'];
		show: { number: number; slug: string } | null;
		video: { url: string } | null;
		was_published: boolean;
	};

	type SubmissionActivity = {
		kind: 'submission';
		timestamp: Date;
		submission_id: string;
		submission_type: (typeof recent_submissions)[number]['submission_type'];
		submitter_name: string | null;
	};

	const content_activity: ContentActivity[] = recent_content_updates.map((row) => ({
		kind: 'content',
		timestamp: row.updated_at,
		content_id: row.id,
		content_type: row.type,
		title: row.title,
		status: row.status,
		show: row.show,
		video: row.video,
		was_published:
			row.status === 'PUBLISHED' &&
			row.published_at !== null &&
			row.published_at >= seven_days_ago
	}));

	const submission_activity: SubmissionActivity[] = recent_submissions.map((row) => ({
		kind: 'submission',
		timestamp: row.created_at,
		submission_id: row.id,
		submission_type: row.submission_type,
		submitter_name: row.name
	}));

	const activity: Array<ContentActivity | SubmissionActivity> = [
		...content_activity,
		...submission_activity
	]
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
		.slice(0, 20);

	return {
		pending_submissions_count: Number(pending_submissions_row?.value ?? 0),
		drafts_count: Number(drafts_row?.value ?? 0),
		scheduled_count: Number(scheduled_row?.value ?? 0),
		submission_breakdown,
		next_shows,
		shows_missing_transcript,
		shows_missing_ai_notes,
		recently_published,
		activity
	};
});
