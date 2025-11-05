import { db } from '$server/db/client';
import {
	userSubmission,
	SUBMISSION_STATUS_VALUES,
	SUBMISSION_TYPE_VALUES
} from '$server/db/schema';
import type { Actions } from './$types';
import { eq, and, asc, desc, count } from 'drizzle-orm';

export const load = async ({ url }) => {
	const submission_type = url.searchParams.get('submission_type');
	const status = url.searchParams.get('status');
	const per_page = parseInt(url.searchParams.get('perPage') || '') || 100;
	const order_parsed = url.searchParams.get('order');
	const orderBy =
		order_parsed === 'asc' ? asc(userSubmission.created_at) : desc(userSubmission.created_at);

	// Build where conditions
	const conditions = [];
	if (submission_type) {
		conditions.push(eq(userSubmission.submission_type, submission_type as any));
	}
	if (status) {
		conditions.push(eq(userSubmission.status, status as any));
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	// Get count
	const [{ value: submission_count }] = await db
		.select({ value: count() })
		.from(userSubmission)
		.where(where);

	// Get submissions
	const submissions = await db.query.userSubmission.findMany({
		limit: per_page,
		orderBy: [orderBy],
		where
	});

	return {
		submissions,
		submission_count,
		// Since we cant access enums on the client, we pass them as arrays
		user_submission_status: SUBMISSION_STATUS_VALUES,
		user_submission_type: SUBMISSION_TYPE_VALUES
	};
};

export const actions: Actions = {
	async update_submission({ locals }) {
		console.log('Updating Submission', locals.form_data);
		const { id, status } = locals.form_data;
		if (typeof id !== 'string' || !status) {
			return { status: 'error', message: 'Invalid submission' };
		}
		await db
			.update(userSubmission)
			.set({
				status: status as any,
				updated_at: new Date()
			})
			.where(eq(userSubmission.id, id));

		return {
			status: 'success',
			message: 'Submission updated'
		};
	},
	async delete_submission({ locals }) {
		console.log('Deleting Submission', locals.form_data);
		const { id } = locals.form_data;
		if (typeof id !== 'string') {
			return { status: 'error', message: 'Invalid submission' };
		}
		await db.delete(userSubmission).where(eq(userSubmission.id, id));

		return {
			status: 'success',
			message: 'Submission deleted'
		};
	}
};
