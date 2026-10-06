import { sign_out_syntax_auth } from '$server/auth/syntax_auth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, url, fetch }) => {
	return sign_out_syntax_auth(request, url, fetch);
};
