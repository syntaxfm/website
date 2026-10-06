import { redirect } from '@sveltejs/kit';

import { get_sign_in_redirect, get_sign_in_return_to } from '$server/auth/syntax_auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url, setHeaders }) => {
	if (locals.user) {
		return {};
	}

	const return_to = get_sign_in_return_to(url.searchParams.get('return_to'), url);
	const { location, headers } = get_sign_in_redirect(return_to);
	setHeaders(headers);
	redirect(302, location);
};
