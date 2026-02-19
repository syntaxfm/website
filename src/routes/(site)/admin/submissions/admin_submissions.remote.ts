import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import {
	SUBMISSION_STATUS_VALUES,
	SUBMISSION_TYPE_VALUES,
	userSubmission
} from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import * as v from 'valibot';

type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES.enumValues)[number];
type SubmissionType = (typeof SUBMISSION_TYPE_VALUES.enumValues)[number];

const list_submissions_schema = v.object({
	submission_type: v.optional(v.string()),
	status: v.optional(v.string()),
	per_page: v.optional(v.number()),
	order: v.optional(v.string())
});

const update_submission_schema = v.object({
	id: v.string(),
	status: v.string()
});

const delete_submission_schema = v.object({
	id: v.string()
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
}

export const get_submissions = query(
	list_submissions_schema,
	async ({ submission_type, status, per_page: raw_per_page, order }) => {
		assert_admin_user();
		const submission_type_param = submission_type?.trim() || '';
		const status_param = status?.trim() || '';
		const per_page = Math.min(250, Math.max(1, raw_per_page || 100));
		const order_param = order?.toLowerCase();
		const order_by =
			order_param === 'asc' ? asc(userSubmission.created_at) : desc(userSubmission.created_at);

		const user_submission_status = SUBMISSION_STATUS_VALUES.enumValues;
		const user_submission_type = SUBMISSION_TYPE_VALUES.enumValues;

		const conditions = [];
		if (
			submission_type_param.length > 0 &&
			user_submission_type.includes(submission_type_param as SubmissionType)
		) {
			conditions.push(eq(userSubmission.submission_type, submission_type_param as SubmissionType));
		}
		if (
			status_param.length > 0 &&
			user_submission_status.includes(status_param as SubmissionStatus)
		) {
			conditions.push(eq(userSubmission.status, status_param as SubmissionStatus));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const count_query = db.select({ submission_count: count() }).from(userSubmission);
		const [{ submission_count }] = where ? await count_query.where(where) : await count_query;

		const submissions = await db.query.userSubmission.findMany({
			limit: per_page,
			orderBy: [order_by],
			where
		});

		return {
			submissions,
			submission_count,
			user_submission_status,
			user_submission_type
		};
	}
);

export const update_submission_status = command(update_submission_schema, async (input) => {
	assert_admin_user();

	const next_status = input.status;
	if (!SUBMISSION_STATUS_VALUES.enumValues.includes(next_status as SubmissionStatus)) {
		error(400, 'Invalid status');
	}

	await db
		.update(userSubmission)
		.set({
			status: next_status as SubmissionStatus,
			updated_at: new Date()
		})
		.where(eq(userSubmission.id, input.id));

	return {
		success: true
	};
});

export const delete_submission = command(delete_submission_schema, async (input) => {
	assert_admin_user();

	await db.delete(userSubmission).where(eq(userSubmission.id, input.id));

	return {
		success: true
	};
});
