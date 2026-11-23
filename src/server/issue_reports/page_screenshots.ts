// Issue report screenshots, taken by a headless Chrome (headless_browser.ts) that opens the
// reported page the way the admin had it: the same window size, pixel density, scroll position,
// light or dark mode, reduced motion, phone or not, and browser identity, signed in as them (their
// cookies, only ever for this site). So they're real pixels from any device. What they can't have
// is what only the admin's browser had: menus they opened, text they typed, Safari's own drawing.
//
// Loading the page is the slow part, so Report opens it as soon as it's clicked and keeps it open
// (open_reported_page) while the admin selects. Letting go shoots the screen (shoot_screen) for the
// dialog's preview, then the full page (shoot_full_page) while they write.
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { getRequestEvent } from '$app/server';
import {
	MAX_SCREENSHOT_BYTES,
	type IssueReportPage,
	type Screenshot,
	type ViewportRect
} from '#lib/issue_reports/issue_report_schema.ts';
import { run_in_page, with_kept_page, type HeadlessPage } from '$server/headless_browser';

// Sharp enough for text on any screen, without huge phone screenshots
const MAX_SCALE = 2;
// The page may keep the network busy (analytics, video); after this it's shot anyway
const LOAD_TIMEOUT_MS = 15_000;
// How long images get to finish loading before a shot
const IMAGE_WAIT_MS = 4_000;
// JPEG: Cloudflare's browser writes it in half the time WebP takes
const SCREEN_QUALITY = 90;
// The full page as JPEG: WebP can't be taller than 16,383px. Smaller tries if it's over the limit.
const FULL_PAGE_TRIES = [
	{ quality: 80, scale: 1 },
	{ quality: 70, scale: 0.75 },
	{ quality: 60, scale: 0.5 }
];

function to_base64(bytes: Uint8Array): string {
	let binary = '';
	for (let start = 0; start < bytes.length; start += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
	}
	return btoa(binary);
}

// The admin's cookies, for the page's own address only
function cookies_for(cookie_header: string | null, url: string) {
	return (cookie_header ?? '').split(/;\s*/).flatMap((pair) => {
		const equals = pair.indexOf('=');
		return equals > 0 ? [{ name: pair.slice(0, equals), value: pair.slice(equals + 1), url }] : [];
	});
}

// Only ever this site: the browser carries the admin's cookies
function assert_this_site(page: IssueReportPage) {
	if (new URL(page.url).host !== getRequestEvent().url.host) {
		error(400, 'Screenshots are only taken of this site');
	}
}

const settled_schema = v.object({
	width: v.number(),
	height: v.number(),
	scroll: v.object({ x: v.number(), y: v.number() }),
	is_anchored: v.boolean()
});

// Runs in the headless page: hide scrollbars (the admin's Mac or phone draws them over the page),
// wait for fonts, scroll where the admin was, and wait for the images on screen. With an anchor it
// scrolls so that element sits where it sat for the admin, whose browser may have laid the page out
// a little differently; again once images have loaded, as they can push it down.
async function settle_page(input: {
	scroll: { x: number; y: number };
	anchor: IssueReportPage['anchor'];
	image_wait_ms: number;
}) {
	const style = document.createElement('style');
	style.textContent = 'html { scrollbar-width: none; }';
	document.head.append(style);
	await document.fonts.ready;

	const { anchor } = input;
	let is_anchored = false;
	for (const is_second_pass of [false, true]) {
		if (is_second_pass) {
			const deadline = Date.now() + input.image_wait_ms;
			while (
				Date.now() < deadline &&
				[...document.images].some((image) => {
					const rect = image.getBoundingClientRect();
					return !image.complete && rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight;
				})
			) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}
		const element = anchor && document.querySelector(anchor.path);
		// The same element only if it says the same (the page may have changed since)
		const text = (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
		const box =
			anchor && element && text.startsWith(anchor.text.replace(/…$/, '').slice(0, 40))
				? element.getBoundingClientRect()
				: null;
		is_anchored = anchor !== null && box !== null;
		const target =
			anchor && box
				? { x: box.x + scrollX - anchor.x, y: box.y + scrollY - anchor.y }
				: input.scroll;
		scrollTo(Math.max(0, target.x), Math.max(0, target.y));
	}
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	return {
		width: document.documentElement.scrollWidth,
		height: document.documentElement.scrollHeight,
		scroll: { x: scrollX, y: scrollY },
		is_anchored
	};
}

// Runs in the headless page: load every image (lazy ones never would off screen) and decode it
// (Chrome leaves `decoding="async"` images off screen blank in the shot), then outline the screen
// (dashed) and the selection (solid) where they are on the page
async function prepare_full_page(input: {
	screen: ViewportRect;
	selection: ViewportRect | null;
	image_wait_ms: number;
}) {
	for (const image of document.images) image.loading = 'eager';
	const deadline = Date.now() + input.image_wait_ms;
	while (Date.now() < deadline && [...document.images].some((image) => !image.complete)) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	// Not those still loading, which would hold decode() up
	await Promise.all(
		[...document.images]
			.filter((image) => image.complete)
			.map((image) => image.decode().catch(() => undefined))
	);
	const outlines: [ViewportRect | null, string][] = [
		[input.screen, 'dashed'],
		[input.selection, 'solid']
	];
	for (const [rect, line] of outlines) {
		if (!rect) continue;
		const box = document.createElement('div');
		Object.assign(box.style, {
			position: 'absolute',
			left: `${rect.x}px`,
			top: `${rect.y}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			boxSizing: 'border-box',
			border: `3px ${line} #ff2d55`,
			zIndex: '2147483647',
			pointerEvents: 'none'
		});
		document.body.append(box);
	}
}

// The admin's window, light or dark, and browser, at `scale` pixels per CSS pixel. Cloudflare's
// browser forgets these between requests, so every request sets them.
async function emulate_admin(headless: HeadlessPage, page: IssueReportPage, scale: number) {
	const emulation = { isMobile: page.browser.is_mobile, hasTouch: page.browser.is_touch };
	await headless.setViewport({ ...page.window.viewport, deviceScaleFactor: scale, ...emulation });
	await headless.setUserAgent(page.browser.user_agent);
	await headless.emulateMediaFeatures([
		{ name: 'prefers-color-scheme', value: page.color_scheme },
		{ name: 'prefers-reduced-motion', value: page.reduced_motion ? 'reduce' : 'no-preference' }
	]);
}

function screen_scale(page: IssueReportPage) {
	return Math.min(page.window.device_pixel_ratio, MAX_SCALE);
}

// Opens the reported page in the headless browser, signed in as the admin
function load_reported_page(page: IssueReportPage) {
	const cookies = cookies_for(getRequestEvent().request.headers.get('cookie'), page.url);
	return async (headless: HeadlessPage) => {
		await emulate_admin(headless, page, screen_scale(page));
		if (cookies.length > 0) await headless.setCookie(...cookies);
		try {
			await headless.goto(page.url, { waitUntil: 'networkidle2', timeout: LOAD_TIMEOUT_MS });
		} catch (load_error) {
			// Still busy (analytics, a video): what has loaded is shot anyway
			console.error(`The headless browser didn't finish loading ${page.url}`, load_error);
		}
	};
}

async function settle(headless: HeadlessPage, page: IssueReportPage) {
	return v.parse(
		settled_schema,
		await run_in_page(headless, settle_page, {
			scroll: page.scroll,
			anchor: page.anchor,
			image_wait_ms: IMAGE_WAIT_MS
		})
	);
}

/** Opens the reported page and keeps it open for the shots. Returns the kept page's id. */
export async function open_reported_page(page: IssueReportPage): Promise<string> {
	assert_this_site(page);
	const { id } = await with_kept_page(null, {
		load: load_reported_page(page),
		// Scrolled where the admin is, so what's there loads while they select
		use: (headless) => settle(headless, page),
		should_close: false
	});
	return id;
}

/**
 * The screen as the admin has it, from the page Report opened (`kept_page`) or a new one if that's
 * gone. The selection is cut from it by the admin's browser, which knows where it was.
 */
export async function shoot_screen(
	kept_page: string | null,
	page: IssueReportPage
): Promise<{ kept_page: string; screen: Screenshot }> {
	assert_this_site(page);
	const { id, result } = await with_kept_page(kept_page, {
		load: load_reported_page(page),
		use: async (headless) => {
			await emulate_admin(headless, page, screen_scale(page));
			await settle(headless, page);
			return headless.screenshot({
				type: 'jpeg',
				quality: SCREEN_QUALITY,
				captureBeyondViewport: false
			});
		},
		should_close: false
	});
	return { kept_page: id, screen: { media_type: 'image/jpeg', base64: to_base64(result) } };
}

/**
 * The whole page, or its slice, with the screen outlined dashed and the selection solid. Null if
 * it's too big even scaled down. Closes the kept page.
 */
export async function shoot_full_page(
	kept_page: string | null,
	page: IssueReportPage
): Promise<Screenshot | null> {
	assert_this_site(page);
	const { result } = await with_kept_page(kept_page, {
		load: load_reported_page(page),
		use: async (headless) => {
			// One pixel per CSS pixel: it's long, and only people look at it
			await emulate_admin(headless, page, 1);
			const settled = await settle(headless, page);
			const { selection } = page;
			await run_in_page(headless, prepare_full_page, {
				screen: { ...settled.scroll, ...page.window.viewport },
				selection: selection && {
					...selection,
					x: selection.x + settled.scroll.x,
					y: selection.y + settled.scroll.y
				},
				image_wait_ms: IMAGE_WAIT_MS
			});
			// This page may be shorter than the admin's (it loaded fresh), so the slice stays inside it
			const top = Math.min(page.full_page.top, Math.max(0, settled.height - page.full_page.height));
			const height = Math.min(page.full_page.height, settled.height - top);
			for (const { quality, scale } of FULL_PAGE_TRIES) {
				const bytes = await headless.screenshot({
					type: 'jpeg',
					quality,
					clip: { x: 0, y: top, width: settled.width, height, scale },
					captureBeyondViewport: true
				});
				if (bytes.byteLength <= MAX_SCREENSHOT_BYTES) return bytes;
			}
			return null;
		},
		should_close: true
	});
	return result && { media_type: 'image/jpeg', base64: to_base64(result) };
}
