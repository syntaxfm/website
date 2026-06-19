import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import {
	SUBMISSION_STATUS_VALUES,
	SUBMISSION_TYPE_VALUES,
	userSubmission
} from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import * as v from 'valibot';

type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES.enumValues)[number];
type SubmissionType = (typeof SUBMISSION_TYPE_VALUES.enumValues)[number];

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

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
}

function parse_optional_iso_date(maybe_iso: string | null | undefined) {
	if (!maybe_iso) {
		return null;
	}

	const parsed_date = new Date(maybe_iso);
	if (Number.isNaN(parsed_date.getTime())) {
		return null;
	}

	return parsed_date;
}

export const get_submissions = query(
	list_submissions_schema,
	async ({
		search_text: raw_search_text,
		submission_type,
		status,
		date_from_iso,
		date_to_iso,
		order,
		page: raw_page,
		page_size: raw_page_size
	}) => {
		assert_admin_user();
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

export const bulk_update_submission_status = command(bulk_status_schema, async (input) => {
	assert_admin_user();

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
});

export const bulk_delete_submissions = command(bulk_delete_schema, async (input) => {
	assert_admin_user();

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

