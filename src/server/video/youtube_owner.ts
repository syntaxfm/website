import { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } from '$app/env/private';
import { as_number, as_string, read_path } from '#lib/utils/narrow.ts';

// An access token for the Syntax channel's owner, from the refresh token saved when Scott signed
// in once (Google Cloud project 481665326493, "Syntax website" client). Only the owner can
// download captions. Google expires the refresh token after 7 days while the app is in Testing,
// and whenever access is revoked; then every call fails with YouTubeDisconnectedError until
// someone signs in again.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Refresh a minute early so a token never expires mid-request
const EXPIRY_MARGIN_MS = 60 * 1000;

export class YouTubeDisconnectedError extends Error {
	constructor(reason: string) {
		super(`YouTube is disconnected: ${reason}. Sign in again as the Syntax channel owner.`);
		this.name = 'YouTubeDisconnectedError';
	}
}

let cached: { token: string; expires_at: number } | null = null;

export function has_youtube_owner_sign_in(): boolean {
	return Boolean(YOUTUBE_CLIENT_ID && YOUTUBE_CLIENT_SECRET && YOUTUBE_REFRESH_TOKEN);
}

export async function get_youtube_owner_token(): Promise<string> {
	if (cached && cached.expires_at > Date.now()) return cached.token;
	if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
		throw new YouTubeDisconnectedError('the OAuth client or refresh token is not set');
	}

	const response = await fetch(TOKEN_URL, {
		method: 'POST',
		body: new URLSearchParams({
			client_id: YOUTUBE_CLIENT_ID,
			client_secret: YOUTUBE_CLIENT_SECRET,
			refresh_token: YOUTUBE_REFRESH_TOKEN,
			grant_type: 'refresh_token'
		})
	});
	const body: unknown = await response.json();
	const token = as_string(read_path(body, ['access_token']));
	if (!response.ok || !token) {
		const reason = as_string(read_path(body, ['error'])) ?? `HTTP ${response.status}`;
		// invalid_grant: the refresh token expired or was revoked
		if (reason === 'invalid_grant') throw new YouTubeDisconnectedError(reason);
		throw new Error(`Could not refresh the YouTube owner token: ${reason}`);
	}

	const expires_in_seconds = as_number(read_path(body, ['expires_in'])) ?? 3600;
	cached = { token, expires_at: Date.now() + expires_in_seconds * 1000 - EXPIRY_MARGIN_MS };
	return token;
}
