import { db } from '$server/db/client';
import { session } from '$server/db/schema';
import type { Session, User } from '$server/db/types';
import { eq } from 'drizzle-orm';

export async function find_session(
	access_token: string,
	session_token: string,
	user: User,
	details: {
		ip: string;
		country: string;
	}
): Promise<Session> {
	await db
		.update(session)
		.set({
			access_token,
			user_id: user.id,
			updated_at: new Date(),
			ip: details.ip,
			country: details.country
		})
		.where(eq(session.session_token, session_token));

	const updatedSession = await db.query.session.findFirst({
		where: eq(session.session_token, session_token)
	});

	if (!updatedSession) {
		throw new Error('Session not found after update');
	}

	return updatedSession;
}
