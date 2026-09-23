import { eq } from 'drizzle-orm';

import { db } from '$server/db/client';
import { profile } from '$server/db/schema';

import { build_syntax_sign_in_url, type SyntaxAuthUser } from './syntax_auth';

export interface AuthenticatedUser extends SyntaxAuthUser {
	profile_id: string | null;
	roles: string[];
}

export function get_admin_guard_response(
	user: AuthenticatedUser | null,
	return_to: URL
): Response | null {
	if (!user) {
		return Response.redirect(build_syntax_sign_in_url(return_to), 302);
	}

	if (!user.roles.includes('admin')) {
		return new Response('Admin access required', { status: 403 });
	}

	return null;
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
