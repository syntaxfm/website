import { redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { get_youtube_consent_url } from '$server/video/youtube_owner';
import { YOUTUBE_STATE_COOKIE } from '../youtube_connect';

// Connect YouTube: sends the admin to Google's sign-in. The admin guard in hooks.server.ts covers
// every /admin route, this one included. The state cookie ties Google's answer to this browser.
export const GET = async function connect_youtube({ url, cookies }) {
	const state = randomUUID();
	cookies.set(YOUTUBE_STATE_COOKIE, state, {
		path: '/admin/youtube',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 60 * 10
	});
	// SvelteKit only redirects off-site to origins it's told about
	redirect(303, get_youtube_consent_url(`${url.origin}/admin/youtube/callback`, state), {
		external: ['https://accounts.google.com']
	});
};
