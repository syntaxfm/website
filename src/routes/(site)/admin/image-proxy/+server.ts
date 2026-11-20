// Other sites' images for the Report button's screenshots (#lib/issue_reports/image_proxy.ts).
// Admins only (the admin hook and the check below), and only from the listed hosts.
import { error } from '@sveltejs/kit';
import { proxyable_image_url } from '#lib/issue_reports/image_proxy.ts';
import { get_request_user } from '$server/auth/request_auth';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8_000;

export const GET = async function proxy_image(event) {
	const user = await get_request_user(event);
	if (!user?.roles.includes('admin')) error(403, 'Admin access required');

	const image_url = proxyable_image_url(event.url.searchParams.get('url') ?? '');
	if (!image_url) error(400, 'Not an image this proxy reads');

	const response = await fetch(image_url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
	const content_type = response.headers.get('content-type') ?? '';
	if (!response.ok || !content_type.startsWith('image/')) {
		error(502, `${image_url.hostname} answered ${response.status} ${content_type}`);
	}
	const bytes = await response.arrayBuffer();
	if (bytes.byteLength > MAX_IMAGE_BYTES) error(502, 'The image is too big');

	return new Response(bytes, {
		headers: { 'content-type': content_type, 'cache-control': 'private, max-age=86400' }
	});
};
