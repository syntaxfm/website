import { CRON_SECRET } from '$app/env/private';

// Webhooks and crons must present CRON_SECRET, as ?CRON_SECRET= or `Authorization: Bearer`.
// With no secret configured nothing is allowed: reading an unset secret used to make
// `Authorization: Bearer undefined` match (process.env is empty on Cloudflare Workers).
export function has_auth(request: Request) {
	if (!CRON_SECRET) return false;
	const url = new URL(request.url);
	const has_cron_secret = url.searchParams.get('CRON_SECRET') === CRON_SECRET;
	const has_auth_header = request.headers.get('authorization') === `Bearer ${CRON_SECRET}`;
	return has_cron_secret || has_auth_header;
}
