import { eq } from 'drizzle-orm';
import { YOUTUBE_CHANNEL_ID } from '$const';
import { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } from '$app/env/private';
import { db } from '$server/db/client';
import { oauth_connection } from '$server/db/schema';
import { as_array, as_number, as_string, read_path } from '#lib/utils/narrow.ts';

// Acting as the Syntax channel's owner, which downloading captions needs. An admin connects once
// with Connect YouTube (src/routes/(site)/admin/youtube): Google returns a refresh token, saved in
// oauth_connections, that scheduled jobs trade for an hour-long access token. The OAuth client
// ("Syntax website", an internal app in our Google org) is YOUTUBE_CLIENT_ID / _SECRET. If Google
// refuses the refresh token, the row is marked failed and admin asks for a reconnect.

const PROVIDER = 'youtube';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Download captions (captions.download takes this or youtubepartner)
const SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
// Refresh a minute early so a token never expires mid-request
const EXPIRY_MARGIN_MS = 60 * 1000;

export type YouTubeConnection =
	| { status: 'missing' }
	| { status: 'connected'; account_name: string | null; connected_at: Date }
	| { status: 'failed'; account_name: string | null; failed_at: Date; failure: string };

export class YouTubeDisconnectedError extends Error {
	constructor(reason: string) {
		super(`YouTube is disconnected: ${reason}`);
		this.name = 'YouTubeDisconnectedError';
	}
}

let cached: { token: string; expires_at: number } | null = null;

function client_credentials() {
	if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
		throw new Error('YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set to connect YouTube');
	}
	return { client_id: YOUTUBE_CLIENT_ID, client_secret: YOUTUBE_CLIENT_SECRET };
}

async function post_token(params: Record<string, string>) {
	const response = await fetch(TOKEN_URL, {
		method: 'POST',
		body: new URLSearchParams({ ...client_credentials(), ...params })
	});
	const body: unknown = await response.json();
	return { ok: response.ok, body, error: as_string(read_path(body, ['error'])) };
}

export async function get_youtube_connection(): Promise<YouTubeConnection> {
	const row = await db.query.oauth_connection.findFirst({
		where: eq(oauth_connection.provider, PROVIDER),
		columns: { account_name: true, connected_at: true, failed_at: true, failure: true }
	});
	if (!row) return { status: 'missing' };
	if (row.failed_at) {
		return {
			status: 'failed',
			account_name: row.account_name,
			failed_at: row.failed_at,
			failure: row.failure ?? 'Google refused the sign-in'
		};
	}
	return { status: 'connected', account_name: row.account_name, connected_at: row.connected_at };
}

// Google's sign-in page. `offline` + `consent` makes Google return a refresh token every time.
export function get_youtube_consent_url(redirect_uri: string, state: string): string {
	const url = new URL(AUTH_URL);
	url.search = new URLSearchParams({
		client_id: client_credentials().client_id,
		redirect_uri,
		response_type: 'code',
		scope: SCOPE,
		access_type: 'offline',
		prompt: 'consent',
		state
	}).toString();
	return url.toString();
}

/**
 * Connect YouTube, step 1: trades Google's code for an access token (to check the account can
 * download Syntax's captions) and the refresh token to keep.
 */
export async function exchange_youtube_code(code: string, redirect_uri: string) {
	const exchange = await post_token({ code, redirect_uri, grant_type: 'authorization_code' });
	const access_token = as_string(read_path(exchange.body, ['access_token']));
	const refresh_token = as_string(read_path(exchange.body, ['refresh_token']));
	if (!exchange.ok || !access_token || !refresh_token) {
		throw new Error(`Google didn't finish the sign-in (${exchange.error ?? 'no refresh token'})`);
	}
	return { access_token, refresh_token };
}

// The name of the account's own channel, if it has one, to show in admin
export async function get_signed_in_channel_name(access_token: string): Promise<string | null> {
	const channels = await fetch(
		'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
		{ headers: { authorization: `Bearer ${access_token}` } }
	).then((response) => response.json() as Promise<unknown>);
	const items = as_array(read_path(channels, ['items']));
	const syntax = items.find((item) => as_string(read_path(item, ['id'])) === YOUTUBE_CHANNEL_ID);
	return as_string(read_path(syntax ?? items[0], ['snippet', 'title']));
}

/** Connect YouTube, step 2: keeps the refresh token once the account has proved it can download. */
export async function save_youtube_connection(
	refresh_token: string,
	account_name: string | null,
	profile_id: string | null
): Promise<void> {
	const now = new Date();
	await db
		.insert(oauth_connection)
		.values({
			provider: PROVIDER,
			refresh_token,
			account_name,
			connected_by: profile_id,
			connected_at: now
		})
		.onConflictDoUpdate({
			target: oauth_connection.provider,
			set: {
				refresh_token,
				account_name,
				connected_by: profile_id,
				connected_at: now,
				failed_at: null,
				failure: null
			}
		});
	cached = null;
}

export async function get_youtube_owner_token(): Promise<string> {
	if (cached && cached.expires_at > Date.now()) return cached.token;

	const row = await db.query.oauth_connection.findFirst({
		where: eq(oauth_connection.provider, PROVIDER),
		columns: { refresh_token: true, failed_at: true }
	});
	if (!row) throw new YouTubeDisconnectedError('nobody has connected YouTube yet');
	if (row.failed_at) throw new YouTubeDisconnectedError('Google refused the last sign-in');

	const refreshed = await post_token({
		refresh_token: row.refresh_token,
		grant_type: 'refresh_token'
	});
	const token = as_string(read_path(refreshed.body, ['access_token']));
	if (!refreshed.ok || !token) {
		// invalid_grant: the refresh token expired or was revoked, so ask an admin to reconnect
		if (refreshed.error === 'invalid_grant') {
			await db
				.update(oauth_connection)
				.set({ failed_at: new Date(), failure: 'Google expired or revoked the sign-in' })
				.where(eq(oauth_connection.provider, PROVIDER));
			throw new YouTubeDisconnectedError('Google expired or revoked the sign-in');
		}
		throw new Error(`Could not refresh the YouTube owner token: ${refreshed.error ?? 'no token'}`);
	}

	const expires_in_seconds = as_number(read_path(refreshed.body, ['expires_in'])) ?? 3600;
	cached = { token, expires_at: Date.now() + expires_in_seconds * 1000 - EXPIRY_MARGIN_MS };
	return token;
}
