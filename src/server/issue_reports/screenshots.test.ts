import { afterEach, describe, expect, it, vi } from 'vitest';

const { private_env, request_event } = vi.hoisted(() => ({
	private_env: {} as Record<string, string | undefined>,
	request_event: { platform: undefined as { env: Record<string, unknown> } | undefined }
}));
vi.mock('$app/env/private', () => ({
	get CRON_SECRET() {
		return private_env.CRON_SECRET;
	}
}));
vi.mock('$app/server', () => ({ getRequestEvent: () => request_event }));

const {
	SCREENSHOT_KEY_PATTERN,
	is_admin_screenshot_key,
	new_screenshot_key,
	screenshot_visibility,
	store_screenshot
} = await import('./screenshots');

const bytes = new Uint8Array([1, 2, 3]);

afterEach(() => {
	delete private_env.CRON_SECRET;
	request_event.platform = undefined;
	vi.unstubAllGlobals();
});

describe('screenshot keys', () => {
	it('keeps admin pages apart from public ones', () => {
		expect(screenshot_visibility('https://beta.syntax.fm/admin/submissions')).toBe('admin');
		expect(screenshot_visibility('https://beta.syntax.fm/admin')).toBe('admin');
		expect(screenshot_visibility('https://beta.syntax.fm/administrivia')).toBe('public');
		expect(screenshot_visibility('https://beta.syntax.fm/show/900/x')).toBe('public');
	});

	it('makes keys the screenshot route accepts', () => {
		const key = new_screenshot_key('admin', 'image/webp', new Date('2026-11-20T00:00:00Z'));
		expect(key).toMatch(/^admin\/2026-11\/[0-9a-f-]{36}\.webp$/);
		expect(SCREENSHOT_KEY_PATTERN.test(key)).toBe(true);
		expect(is_admin_screenshot_key(key)).toBe(true);
		expect(SCREENSHOT_KEY_PATTERN.test('admin/../secrets.png')).toBe(false);
	});
});

describe('store_screenshot', () => {
	it('puts it in R2 when the Worker has the bucket', async () => {
		const put = vi.fn();
		request_event.platform = { env: { ISSUE_SCREENSHOTS: { put } } };
		const url = await store_screenshot('public/2026-11/a.png', bytes, 'image/png');
		expect(put).toHaveBeenCalledWith('public/2026-11/a.png', bytes, {
			httpMetadata: { contentType: 'image/png' }
		});
		expect(url).toBe('https://beta.syntax.fm/issue-screenshots/public/2026-11/a.png');
	});

	it('hands it to the deployed site without R2 (pnpm dev)', async () => {
		private_env.CRON_SECRET = 'secret';
		const fetch_mock = vi.fn(async () => new Response(null, { status: 201 }));
		vi.stubGlobal('fetch', fetch_mock);
		await store_screenshot('public/2026-11/a.png', bytes, 'image/png');
		expect(fetch_mock).toHaveBeenCalledWith(
			'https://beta.syntax.fm/issue-screenshots/public/2026-11/a.png',
			expect.objectContaining({
				method: 'PUT',
				headers: { authorization: 'Bearer secret', 'content-type': 'image/png' }
			})
		);
	});

	it('fails clearly without R2 or CRON_SECRET', async () => {
		await expect(store_screenshot('public/2026-11/a.png', bytes, 'image/png')).rejects.toThrow(
			'CRON_SECRET is not set'
		);
	});
});
