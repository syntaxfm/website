import { command, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import { SUBMISSION_STATUS_VALUES, userSubmission } from '$server/db/schema';
import * as submissions from '$server/submissions/submissions';
import { error } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES.enumValues)[number];

const list_submissions_schema = v.object({
	search_text: v.optional(v.string()),
	submission_type: v.optional(v.string()),
	status: v.optional(v.string()),
	date_from_iso: v.optional(v.string()),
	date_to_iso: v.optional(v.string()),
	order: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const update_submission_schema = v.object({
	id: v.string(),
	status: v.string()
});

const delete_submission_schema = v.object({
	id: v.string()
});

const bulk_status_schema = v.object({
	submission_ids: v.array(v.string()),
	status: v.string()
});

const bulk_delete_schema = v.object({
	submission_ids: v.array(v.string()),
	confirm_text: v.string()
});

export const get_submissions = query(list_submissions_schema, async (input) =>
	submissions.list_submissions(await assert_admin(), input)
);

export const update_submission_status = command(update_submission_schema, async (input) => {
	await assert_admin();

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
	await assert_admin();

	await db.delete(userSubmission).where(eq(userSubmission.id, input.id));

	return {
		success: true
	};
});

export const bulk_update_submission_status = command(bulk_status_schema, async (input) =>
	submissions.bulk_update_submission_status(await assert_admin(), input)
);

export const bulk_delete_submissions = command(bulk_delete_schema, async (input) => {
	await assert_admin();

	if (input.confirm_text !== 'DELETE') {
		error(400, 'Confirmation text required');
	}

	if (input.submission_ids.length === 0) {
		return { deleted_count: 0 };
	}

	const deleted = await db
		.delete(userSubmission)
		.where(inArray(userSubmission.id, input.submission_ids))
		.returning({ id: userSubmission.id });

	return { deleted_count: deleted.length };
});
