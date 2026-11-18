import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';

import { assert_admin_actor, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import {
	SUBMISSION_STATUS_VALUES,
	SUBMISSION_TYPE_VALUES,
	userSubmission
} from '$server/db/schema';
import { parse_optional_iso_date } from '$utilities/parse_optional_iso_date';

// UserSubmissions: audience questions and pitches (docs/CONTEXT.md). Only admins see or triage
// them; the admin Submissions page (admin_submissions.remote.ts) and the MCP endpoint
// (server/mcp) both call these with the person acting.

type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES.enumValues)[number];
type SubmissionType = (typeof SUBMISSION_TYPE_VALUES.enumValues)[number];

export interface ListSubmissionsInput {
	search_text?: string;
	submission_type?: string;
	status?: string;
	date_from_iso?: string;
	date_to_iso?: string;
	order?: string;
	page?: number;
	page_size?: number;
}

export interface BulkSubmissionStatusInput {
	submission_ids: string[];
	status: string;
}

export async function list_submissions(
	actor: Actor,
	{
		search_text: raw_search_text,
		submission_type,
		status,
		date_from_iso,
		date_to_iso,
		order,
		page: raw_page,
		page_size: raw_page_size
	}: ListSubmissionsInput
) {
	assert_admin_actor(actor);

	const search_text = raw_search_text?.trim() ?? '';
	const submission_type_param = submission_type?.trim() || '';
	const status_param = status?.trim() || '';
	const page = Math.max(1, raw_page || 1);
	const page_size = Math.min(250, Math.max(1, raw_page_size || 25));
	const offset = (page - 1) * page_size;
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

	const date_from = parse_optional_iso_date(date_from_iso);
	if (date_from) {
		conditions.push(gte(userSubmission.created_at, date_from));
	}

	const date_to = parse_optional_iso_date(date_to_iso);
	if (date_to) {
		conditions.push(lte(userSubmission.created_at, date_to));
	}

	if (search_text.length > 0) {
		const like_pattern = `%${search_text}%`;
		const search_condition = or(
			ilike(userSubmission.name, like_pattern),
			ilike(userSubmission.email, like_pattern),
			ilike(userSubmission.body, like_pattern)
		);
		if (search_condition) {
			conditions.push(search_condition);
		}
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const total_rows = where
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(userSubmission)
				.where(where)
		: await db.select({ total: sql<number>`count(*)` }).from(userSubmission);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.userSubmission.findMany({
		limit: page_size,
		offset,
		orderBy: [order_by],
		where
	});

	return {
		items,
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size)),
		user_submission_status,
		user_submission_type
	};
}

/** Sets the status of several submissions at once; answers how many changed. */
export async function bulk_update_submission_status(
	actor: Actor,
	input: BulkSubmissionStatusInput
) {
	assert_admin_actor(actor);

	const next_status = input.status;
	if (!SUBMISSION_STATUS_VALUES.enumValues.includes(next_status as SubmissionStatus)) {
		error(400, 'Invalid status');
	}

	if (input.submission_ids.length === 0) {
		return { count: 0 };
	}

	const updated = await db
		.update(userSubmission)
		.set({
			status: next_status as SubmissionStatus,
			updated_at: new Date()
		})
		.where(inArray(userSubmission.id, input.submission_ids))
		.returning({ id: userSubmission.id });

	return { count: updated.length };
}
