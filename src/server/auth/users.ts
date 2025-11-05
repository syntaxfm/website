import type { GithubUser } from '$const';
import { add_user_to_role } from '../roles';
import { db } from '$server/db/client';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { User } from '$server/db/types';
import { session, user } from '$server/db/schema';

export interface UserWithRoles extends User {
	roles: string[];
}

interface Create_User {
	github_user: GithubUser;
}

export async function create_user({ github_user }: Create_User) {
	const userId = randomUUID();

	await db.insert(user).values({
		id: userId,
		avatar_url: github_user.avatar_url,
		email: github_user.email,
		github_id: github_user.id,
		username: github_user.login,
		updated_at: new Date()
	});

	// Fetch and return the full user record
	const newUser = await db.query.user.findFirst({
		where: eq(user.id, userId)
	});

	if (!newUser) {
		throw new Error('Failed to create user');
	}

	return newUser;
}

export async function find_or_create_user({ github_user }: Create_User) {
	const current_user = await db.query.user.findFirst({
		where: eq(user.github_id, github_user.id)
	});

	if (current_user) {
		return current_user;
	} else {
		const new_user = await create_user({ github_user });
		// if it's syntax crew. Upgrade that shit
		if (['wesbos', 'stolinski', 'bl0om', 'w3cj', 'randyrektor'].includes(github_user.login)) {
			add_user_to_role(new_user.id, 'admin');
		}
		return new_user;
	}
}

// look up current user via their access token. First by finding the session then user
export async function find_user_by_access_token(access_token: string) {
	// Get session from access token
	const active_session = await db.query.session.findFirst({
		where: eq(session.access_token, access_token)
	});

	// If a session exists that is tied to a user
	if (active_session?.user_id) {
		return find_user_with_roles(active_session.user_id);
	}
	return null;
}

// Because of how roles are done, the find returns an array of objects
// Here we select from the roles table to populate a user with their roles, but then convert the roles into
// an array of strings
export async function find_user_with_roles(user_id: string): Promise<UserWithRoles> {
	const user_with_roles = await db.query.user.findFirst({
		where: eq(user.id, user_id),
		with: {
			roles: {
				with: {
					role: true
				}
			}
		}
	});

	if (!user_with_roles) {
		throw new Error('User not found');
	}

	const current_user = {
		...user_with_roles,
		roles: user_with_roles.roles.map((user_role) => user_role.role.name)
	};

	return current_user;
}
