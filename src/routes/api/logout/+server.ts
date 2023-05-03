import type { RequestHandler } from './$types';

export const POST: RequestHandler = async function ({ locals, cookies }) {
	// Delete session from database
	await locals.prisma.session.delete({
		where: {
			access_token: cookies.get('access_token')
		}
	});
	// Remove Auth Token Cookie
	cookies.delete('access_token', {
		httpOnly: true,
		path: '/',
		secure: true
	});

	return new Response(JSON.stringify({ message: 'Logout Successful' }), { status: 200 });
};
