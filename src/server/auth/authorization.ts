import { eq } from 'drizzle-orm';

import { db } from '$server/db/client';
import { profile } from '$server/db/schema';

import { dev } from '$app/environment';

import {
	as_remote_request_response,
	get_sign_in_redirect,
	is_remote_read,
	remote_error_response,
	sign_in_redirect_response,
	type SyntaxAuthUser
} from './syntax_auth';

const ADMIN_ACCESS_REQUIRED = 'Admin access required';
const REMOTE_SIGN_IN_NEEDED =
	'Sign in needed: your Syntax sign-in has ended. Sign in, then try again. Nothing was changed.';
const REMOTE_ADMIN_ACCESS_REQUIRED =
	'Admin access required: your Syntax account doesn’t have the admin role. Nothing was changed.';

export interface AuthenticatedUser extends SyntaxAuthUser {
	profile_id: string | null;
	roles: string[];
}

export function get_admin_guard_response(
	user: AuthenticatedUser | null,
	return_to: URL
): Response | null {
	if (!user) {
		return sign_in_redirect_response(return_to);
	}

	if (!user.roles.includes('admin')) {
		return new Response(ADMIN_ACCESS_REQUIRED, { status: 403 });
	}

	return null;
}

/**
 * The admin guard for a remote function call (`/_app/remote/...`) from an admin page. Production
 * answers exactly as get_admin_guard_response. Development answers as SvelteKit's remote client
 * expects, so the caller sees the real reason rather than a generic 500: a signed-out remote read is
 * sent to sign in; any other signed-out call gets a 401 error result with the sign-in path, and a
 * signed-in user without the admin role a 403 error result. None of them run the function.
 */
export function get_admin_remote_guard_response(
	user: AuthenticatedUser | null,
	return_to: URL,
	request: Request
): Response | null {
	const response = get_admin_guard_response(user, return_to);
	if (!dev || !response) {
		return response;
	}

	// The guard refused a signed-in user, so the admin role is missing.
	if (user) {
		return remote_error_response(403, { message: REMOTE_ADMIN_ACCESS_REQUIRED });
	}

	if (is_remote_read(request)) {
		return as_remote_request_response(response);
	}

	return remote_error_response(401, {
		message: REMOTE_SIGN_IN_NEEDED,
		sign_in: get_sign_in_redirect(return_to).location
	});
}

export async function get_authenticated_user(user: SyntaxAuthUser): Promise<AuthenticatedUser> {
	try {
		const user_profile = await db.query.profile.findFirst({
			where: eq(profile.central_user_id, user.id),
			columns: { id: true },
			with: {
				roles: {
					with: { role: true }
				}
			}
		});

		return {
			...user,
			profile_id: user_profile?.id ?? null,
			roles: user_profile?.roles.map((profile_role) => profile_role.role.name) ?? []
		};
	} catch (error) {
		console.error('Failed to load Syntax application authorization', error);
		return { ...user, profile_id: null, roles: [] };
	}
}
