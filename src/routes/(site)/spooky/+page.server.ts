import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { UserSubmissionAction } from '$/lib/forms/UserSubmissionAction';
export const load: PageServerLoad = async function () {
	return {
		meta: {
			title: 'Submit a Spooky Story'
		}
	};
};

export const actions: Actions = {
	default: UserSubmissionAction
};
