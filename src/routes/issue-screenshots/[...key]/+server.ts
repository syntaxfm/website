// Issue report screenshots (server/issue_reports/screenshots.ts). GET serves one: anyone may open a
// public page's screenshot, only admins and CRON_SECRET holders an admin page's. PUT stores one sent
// by `pnpm dev`, which has no R2 of its own.
import { error, json } from '@sveltejs/kit';
import {
	SCREENSHOT_MEDIA_TYPES,
	MAX_SCREENSHOT_BYTES
} from '#lib/issue_reports/issue_report_schema.ts';
import { get_request_user } from '$server/auth/request_auth';
import {
	SCREENSHOT_KEY_PATTERN,
	is_admin_screenshot_key,
	screenshot_url
} from '$server/issue_reports/screenshots';
import { has_auth } from '../../webhooks/transcripts/has_auth';

function is_screenshot_media_type(
	value: string | null
): value is (typeof SCREENSHOT_MEDIA_TYPES)[number] {
	return SCREENSHOT_MEDIA_TYPES.some((media_type) => media_type === value);
}

export const GET = async function get_issue_screenshot(event) {
	const { key } = event.params;
	if (!SCREENSHOT_KEY_PATTERN.test(key)) error(404, 'Not found');

	const is_admin_only = is_admin_screenshot_key(key);
	if (is_admin_only && !has_auth(event.request)) {
		const user = await get_request_user(event);
		if (!user?.roles.includes('admin')) error(404, 'Not found');
	}

	const object = await event.platform?.env.ISSUE_SCREENSHOTS?.get(key);
	if (!object) error(404, 'Not found');

	return new Response(object.body, {
		headers: {
			'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
			// Each key is a new random name, so the image never changes
			'cache-control': `${is_admin_only ? 'private' : 'public'}, max-age=31536000, immutable`,
			'x-robots-tag': 'noindex'
		}
	});
};

export const PUT = async function put_issue_screenshot(event) {
	if (!has_auth(event.request)) error(401, 'Wrong or missing CRON_SECRET');
	const { key } = event.params;
	if (!SCREENSHOT_KEY_PATTERN.test(key)) error(400, 'Not a screenshot key');

	const media_type = event.request.headers.get('content-type');
	if (!is_screenshot_media_type(media_type)) error(415, 'Send a PNG, JPEG or WebP image');

	const bucket = event.platform?.env.ISSUE_SCREENSHOTS;
	if (!bucket) error(503, 'This server has no screenshot storage (ISSUE_SCREENSHOTS)');

	const bytes = new Uint8Array(await event.request.arrayBuffer());
	if (bytes.byteLength === 0 || bytes.byteLength > MAX_SCREENSHOT_BYTES) {
		error(413, 'Screenshots must be 1 byte to 5 MB');
	}
	await bucket.put(key, bytes, { httpMetadata: { contentType: media_type } });
	return json({ url: screenshot_url(key) }, { status: 201 });
};
