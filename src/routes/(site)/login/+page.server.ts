import { redirect } from '@sveltejs/kit';

import {
	get_sign_in_redirect,
	get_sign_in_return_to,
	SIGN_IN_REDIRECT_ORIGINS
} from '$server/auth/syntax_auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url, setHeaders }) => {
	// The account page is per visitor, so it's the one page that renders the user
	if (locals.user) {
		return { user_name: locals.user.name };
	}

	const return_to = get_sign_in_return_to(url.searchParams.get('return_to'), url);
	const { location, headers } = get_sign_in_redirect(return_to);
	setHeaders(headers);
	redirect(302, location, { external: SIGN_IN_REDIRECT_ORIGINS });
};
