import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	cookies.delete('preview_content_id', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev
	});

	const redirect_to = url.searchParams.get('redirect_to') || '/admin/content';
	redirect(302, redirect_to);
};
