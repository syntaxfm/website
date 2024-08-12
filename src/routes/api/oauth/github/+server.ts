import { randomUUID } from 'crypto';
import { GITHUB_AUTH_URL } from '$const';
import { PUBLIC_GITHUB_ID } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma_client } from '$/server/prisma-client';

export const GET: RequestHandler = async function ({ locals, cookies }) {
	const access_token = cookies.get('access_token');

	if (!access_token) {
		// Create session token
		const session_token = randomUUID();

		try {
			// Create a session with the session token to verify the user later
			await prisma_client.session.create({
				data: {
					session_token,
					ip: locals.session.ip,
					country: locals.session.country
				}
			});
		} catch (error) {
			console.error('ERROR', error);
			return new Response('Auth Failed', { status: 401 });
		}
		//  Redirect request to GitHub authentication endpoint with CLIENT_ID
		return new Response('Redirecting to GitHub', {
			status: 302,
			headers: {
				location: `${GITHUB_AUTH_URL}?client_id=${PUBLIC_GITHUB_ID}&state=${session_token}`
			}
		});
	}
	return new Response('Already logged in', { status: 200 });
};
