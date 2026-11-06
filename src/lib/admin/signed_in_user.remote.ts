import { getRequestEvent, query } from '$app/server';
import { get_request_user } from '$server/auth/request_auth';

// Who is signed in, for browser-only UI such as the admin menu. Pages render the same for every
// visitor (so they can be cached), and never include the user.
export const get_signed_in_user = query(async () => {
	const user = await get_request_user(getRequestEvent());
	if (!user) return null;
	return { name: user.name, image: user.image, roles: user.roles };
});
