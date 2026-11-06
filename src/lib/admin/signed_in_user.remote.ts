import { getRequestEvent, query } from '$app/server';

// Who is signed in, for browser-only UI such as the admin menu. Pages render the same for every
// visitor (so they can be cached), and never include the user.
export const get_signed_in_user = query(() => {
	const { user } = getRequestEvent().locals;
	if (!user) return null;
	return { name: user.name, image: user.image, roles: user.roles };
});
