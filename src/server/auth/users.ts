import type { GithubUser } from '$const';
import { add_user_to_role } from '../roles';
import { prisma_client } from '../../hooks.server';
import type { User } from '@prisma/client';

export interface UserWithRoles extends User {
	roles: string[];
}

interface Create_User {
	github_user: GithubUser;
}

export function create_user({ github_user }: Create_User) {
	return prisma_client.user.create({
		data: {
			avatar_url: github_user.avatar_url,
			email: github_user.email,
			github_id: github_user.id,
			username: github_user.login
		}
	});
}

export async function find_or_create_user({ github_user }: Create_User) {
	const user = await prisma_client.user.findUnique({
		where: {
			github_id: github_user.id
		}
	});
	if (user) {
		return user;
	} else {
		const new_user = await create_user({ github_user });
		// if it's Wes or Scott. Upgrade that shit
		if (['wesbos', 'stolinski', 'bl0om', 'benvinegar', 'w3cj'].includes(github_user.login)) {
			add_user_to_role(new_user.id, 'admin');
		}
		return new_user;
	}
}

// look up current user via their access token. First by finding the session then user
export async function find_user_by_access_token(access_token: string) {
	// Get session from access token
	const session = await prisma_client.session.findUnique({
		where: {
			access_token
		}
	});
	// If a session exists that is tied to a user
	if (session?.user_id) {
		return find_user_with_roles(session.user_id);
	}
	return null;
}

// Because of how roles are done, the find returns an array of objects
// Here we select from the roles table to populate a user with their roles, but then convert the roles into
// an array of strings
export async function find_user_with_roles(user_id: string): Promise<UserWithRoles> {
	const user_with_roles = await prisma_client.user.findUnique({
		where: { id: user_id },
		include: {
			roles: {
				select: {
					role: {
						select: {
							name: true
						}
					}
				}
			}
		}
	});
	if (!user_with_roles) {
		throw new Error('User not found');
	}

	const user = {
		...user_with_roles,
		roles: user_with_roles.roles.map((user_role) => user_role.role.name)
	};

	return user;
}
