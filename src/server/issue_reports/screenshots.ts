// Issue report screenshots live in R2 (ISSUE_SCREENSHOTS, alchemy.run.ts) and are served by the
// deployed site at /issue-screenshots/<key>, so GitHub can show them in the issue. Screenshots of
// /admin pages can hold listeners' personal data, and the repository is public, so only admins (and
// anyone holding CRON_SECRET, such as the agent that fixes the issue) can open those.
import { CRON_SECRET } from '$app/env/private';
import { getRequestEvent } from '$app/server';
import type { ScreenshotMediaType } from '#lib/issue_reports/issue_report_schema.ts';

// `pnpm dev` has no R2, so it hands screenshots to the deployed site, and every link points there
export const SCREENSHOT_SITE_ORIGIN = 'https://beta.syntax.fm';

export type ScreenshotVisibility = 'public' | 'admin';

const EXTENSION_BY_MEDIA_TYPE: Record<ScreenshotMediaType, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp'
};

export const SCREENSHOT_KEY_PATTERN =
	/^(public|admin)\/\d{4}-\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp)$/;

export function is_admin_screenshot_key(key: string): boolean {
	return key.startsWith('admin/');
}

export function screenshot_visibility(page_url: string): ScreenshotVisibility {
	const { pathname } = new URL(page_url);
	return pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin' : 'public';
}

export function new_screenshot_key(
	visibility: ScreenshotVisibility,
	media_type: ScreenshotMediaType,
	now = new Date()
): string {
	const month = now.toISOString().slice(0, 7);
	return `${visibility}/${month}/${crypto.randomUUID()}.${EXTENSION_BY_MEDIA_TYPE[media_type]}`;
}

export function screenshot_url(key: string): string {
	return `${SCREENSHOT_SITE_ORIGIN}/issue-screenshots/${key}`;
}

/** Stores the screenshot under `key` and returns its URL. */
export async function store_screenshot(
	key: string,
	bytes: Uint8Array<ArrayBuffer>,
	media_type: ScreenshotMediaType
): Promise<string> {
	const bucket = getRequestEvent().platform?.env.ISSUE_SCREENSHOTS;
	if (bucket) {
		await bucket.put(key, bytes, { httpMetadata: { contentType: media_type } });
		return screenshot_url(key);
	}

	if (!CRON_SECRET) {
		throw new Error(
			`CRON_SECRET is not set, so the screenshot can’t go to ${SCREENSHOT_SITE_ORIGIN}`
		);
	}
	const response = await fetch(screenshot_url(key), {
		method: 'PUT',
		headers: { authorization: `Bearer ${CRON_SECRET}`, 'content-type': media_type },
		body: bytes
	});
	if (!response.ok) {
		throw new Error(
			`${SCREENSHOT_SITE_ORIGIN} didn’t store the screenshot: ${response.status} ${await response.text()}`
		);
	}
	return screenshot_url(key);
}
