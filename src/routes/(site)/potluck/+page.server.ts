// TODO convert to remote form functions
import { fail } from '@sveltejs/kit';
import { user_submission_action } from '$lib/forms/UserSubmissionAction';

export const actions = {
	default: user_submission_action
};
