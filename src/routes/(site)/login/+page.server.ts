import { redirect } from '@sveltejs/kit';

import {
	get_sign_in_redirect,
	get_sign_in_return_to,
	SIGN_IN_REDIRECT_ORIGINS
} from '$server/auth/syntax_auth';

import { get_request_user } from '$server/auth/request_auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { url } = event;
	// The account page is per visitor, so it's the one page that renders the user
	const user = await get_request_user(event);
	if (user) {
		return { user_name: user.name };
	}

	const return_to = get_sign_in_return_to(url.searchParams.get('return_to'), url);
	const { location, headers } = get_sign_in_redirect(return_to);
	event.setHeaders(headers);
	redirect(302, location, { external: SIGN_IN_REDIRECT_ORIGINS });
};
