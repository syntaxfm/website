import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { user_submission_action } from '$/lib/forms/UserSubmissionAction';
export const load: PageServerLoad = async function () {
	return {
		meta: {
			title: 'Ask a Potluck Question'
		}
	};
};

export const actions: Actions = {
	default: user_submission_action
};
