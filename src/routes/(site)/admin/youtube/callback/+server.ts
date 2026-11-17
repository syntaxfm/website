import { redirect } from '@sveltejs/kit';
import { get_request_user } from '$server/auth/request_auth';
import { save_youtube_connection } from '$server/video/youtube_owner';
import { YOUTUBE_RETURN_PATH, YOUTUBE_STATE_COOKIE } from '../youtube_connect';

// Google sends the admin back here after Connect YouTube. The admin lands on the videos page with
// ?youtube= saying how it went.
export const GET = async function youtube_callback(event) {
	const { url, cookies } = event;
	const expected_state = cookies.get(YOUTUBE_STATE_COOKIE);
	cookies.delete(YOUTUBE_STATE_COOKIE, { path: '/admin/youtube' });
	const code = url.searchParams.get('code');

	let result = 'connected';
	if (!code || !expected_state || url.searchParams.get('state') !== expected_state) {
		result = url.searchParams.get('error') === 'access_denied' ? 'cancelled' : 'failed';
	} else {
		try {
			const user = await get_request_user(event);
			await save_youtube_connection(
				code,
				`${url.origin}/admin/youtube/callback`,
				user?.profile_id ?? null
			);
		} catch (connect_error) {
			console.error('Connect YouTube failed', connect_error);
			result = connect_error instanceof Error ? connect_error.message : 'failed';
		}
	}
	redirect(303, `${YOUTUBE_RETURN_PATH}?${new URLSearchParams({ youtube: result })}`);
};
