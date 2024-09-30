import { prisma_client } from '$/server/prisma-client';
import { import_transcripts } from '$server/transcripts/transcripts';
import { Prisma } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import type { equal } from 'assert';

export const load: PageServerLoad = async ({ url }) => {
	console.log('params', url.searchParams.entries());
	const submission_type = url.searchParams.get('submission_type');
	const status = url.searchParams.get('status');
	const per_page = parseInt(url.searchParams.get('perPage') || '') || 100;
	const order_parsed = url.searchParams.get('order');
	const order = order_parsed === 'asc' ? 'asc' : 'desc';
	const submissions_query = Prisma.validator<Prisma.UserSubmissionFindManyArgs>()({
		take: per_page,
		orderBy: {
			created_at: order
		},
		where: {}
	});
	if (submission_type) {
		submissions_query.where = {
			...submissions_query.where,
			submission_type
		};
	}
	if (status) {
		submissions_query.where = {
			...submissions_query.where,
			status
		};
	}

	const submissionCount = await prisma_client.userSubmission.count({
		...submissions_query,
		take: undefined
	});

	const submissions = await prisma_client.userSubmission.findMany(submissions_query);
	return {
		submissions,
		submissionCount
	};
};

export const actions: Actions = {
	async update_submission({ locals }) {
		console.log('Updating Submission', locals.form_data);
		const { id, status } = locals.form_data;
		if (typeof id !== 'string' || !status) {
			return { status: 'error', message: 'Invalid submission' };
		}
		const result = await prisma_client.userSubmission.update({
			where: {
				id: id
			},
			data: {
				status: status
			}
		});
		console.log(result);
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
		const result = await prisma_client.userSubmission.delete({
			where: {
				id: id
			}
		});
		console.log(result);
		return {
			status: 'success',
			message: 'Submission deleted'
		};
	}
};
