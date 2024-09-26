import { prisma_client } from '$/server/prisma-client';
import { import_transcripts } from '$server/transcripts/transcripts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const submissions = await prisma_client.userSubmission.findMany({
		orderBy: {
			created_at: 'desc'
		}
	});
	return {
		submissions
	};
};
