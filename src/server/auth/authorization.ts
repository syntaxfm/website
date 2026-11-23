import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '$server/db/client';
import { profile } from '$server/db/schema';

import { dev } from '$app/env';

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

/**
 * Who a server function acts for: the central User ID, the Profile mapped to it, and that Profile's
 * roles. A browser session (get_authenticated_user) and an MCP access token (server/mcp) both
 * resolve to one, so the same function answers both with the same rules.
 */
export type Actor = Pick<AuthenticatedUser, 'id' | 'profile_id' | 'roles'>;

export function is_admin(actor: Actor): boolean {
	return actor.roles.includes('admin');
}

/** For server functions only admins may run: a 403 before anything is read or changed. */
export function assert_admin_actor(actor: Actor): void {
	if (!is_admin(actor)) error(403, ADMIN_ACCESS_REQUIRED);
}

/**
 * The Profile mapped to a central User ID and its roles. A User without one has no roles, and so
 * does everyone while the database can't answer: a failure never grants or keeps a role.
 */
export async function get_profile_authorization(
	central_user_id: string
): Promise<Pick<AuthenticatedUser, 'profile_id' | 'roles'>> {
	try {
		const user_profile = await db.query.profile.findFirst({
			where: eq(profile.central_user_id, central_user_id),
			columns: { id: true },
			with: {
				roles: {
					with: { role: true }
				}
			}
		});

		return {
			profile_id: user_profile?.id ?? null,
			roles: user_profile?.roles.map((profile_role) => profile_role.role.name) ?? []
		};
	} catch (load_error) {
		console.error('Failed to load Syntax application authorization', load_error);
		return { profile_id: null, roles: [] };
	}
}

/**
 * Links the Profile with this GitHub user ID to a central User, if no User has it yet. Returns
 * whether a Profile was linked. A failure links nothing, so it never grants a role.
 */
async function link_profile_by_github_id(
	central_user_id: string,
	github_id: number
): Promise<boolean> {
	try {
		const linked = await db
			.update(profile)
			.set({ central_user_id, updated_at: new Date() })
			.where(and(eq(profile.github_id, github_id), isNull(profile.central_user_id)))
			.returning({ id: profile.id });
		return linked.length > 0;
	} catch (link_error) {
		console.error('Failed to link a Profile to its Syntax Auth user', link_error);
		return false;
	}
}

/**
 * The signed-in User with their Profile's roles. A User without a linked Profile is linked here, by
 * the GitHub ID their session signed in with (`find_github_id`), to the Profile with that GitHub ID.
 * So someone given a role before they ever signed in has it from their first sign-in.
 */
export async function get_authenticated_user(
	user: SyntaxAuthUser,
	find_github_id: () => Promise<number | null>
): Promise<AuthenticatedUser> {
	const authorization = await get_profile_authorization(user.id);
	if (authorization.profile_id) return { ...user, ...authorization };

	const github_id = await find_github_id();
	if (github_id === null || !(await link_profile_by_github_id(user.id, github_id))) {
		return { ...user, ...authorization };
	}
	return { ...user, ...(await get_profile_authorization(user.id)) };
}
