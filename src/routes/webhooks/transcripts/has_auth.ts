export function has_auth(request: Request) {
	const url = new URL(request.url);
	const auth_header = request.headers.get('authorization');
	const cron_secret = url.searchParams.get('CRON_SECRET') === process.env.CRON_SECRET;
	const has_auth_header = auth_header === `Bearer ${process.env.CRON_SECRET}`;
	const has_auth = cron_secret || has_auth_header;
	return has_auth;
}
