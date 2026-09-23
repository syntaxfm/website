import { redirect } from '@sveltejs/kit';

import { build_syntax_sign_in_url, is_trusted_syntax_url } from '$server/auth/syntax_auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		return {};
	}

	let return_to = new URL('/', url);
	const requested_return_to = url.searchParams.get('return_to');
	if (requested_return_to) {
		try {
			const candidate = new URL(requested_return_to, url);
			if (is_trusted_syntax_url(candidate)) {
				return_to = candidate;
			}
		} catch {
			// Invalid URLs fall back to this application's home page.
		}
	}

	redirect(302, build_syntax_sign_in_url(return_to));
};
