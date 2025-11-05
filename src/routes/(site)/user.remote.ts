import { form, getRequestEvent } from '$app/server';
import { db } from '$server/db/client';
import { session } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export const logout = form(async () => {
	const event = getRequestEvent();

	const cookie = event.cookies.get('access_token');

	await db.delete(session).where(eq(session.access_token, cookie || ''));

	// Remove Auth Token Cookie
	event.cookies.delete('access_token', {
		httpOnly: true,
		path: '/',
		secure: true
	});
	return {
		message: 'Logout Successful'
	};
});
