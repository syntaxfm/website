import type { Session, User } from '@prisma/client';
import { prisma_client } from '$/server/prisma-client';

export async function find_session(
	access_token: string,
	session_token: string,
	user: User,
	details: {
		ip: string;
		country: string;
	}
): Promise<Session> {
	return prisma_client.session.update({
		where: {
			session_token
		},
		data: {
			access_token,
			user_id: user.id,
			session_token,
			ip: details.ip,
			country: details.country
		}
	});
}
