import { type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { user_submission_action } from '$/lib/forms/UserSubmissionAction';
export const load: PageServerLoad = async function () {
	return {
		meta: {
			title: '$50,000 for Open Source',
			description: 'Syntax is Pledging $50,000 to open source projects.'
		}
	};
};

export const actions: Actions = {
	default: user_submission_action
};
