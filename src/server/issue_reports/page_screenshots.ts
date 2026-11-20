// Issue report screenshots, taken by a headless Chrome (headless_browser.ts) that opens the
// reported page the way the admin had it: the same window size, pixel density, scroll position,
// light or dark mode, reduced motion, phone or not, and browser identity, signed in as them (their
// cookies, only ever for this site). So they're real pixels from any device. What they can't have
// is what only the admin's browser had: menus they opened, text they typed, Safari's own drawing.
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	MAX_SCREENSHOT_BYTES,
	type IssueReportPage,
	type Screenshot,
	type ViewportRect
} from '#lib/issue_reports/issue_report_schema.ts';
import { run_in_page, with_headless_page, type HeadlessPage } from '$server/headless_browser';

// Sharp enough for text on any screen, without huge phone screenshots
const MAX_SCALE = 2;
// The page may keep the network busy (analytics, video); after this it's shot anyway
const LOAD_TIMEOUT_MS = 15_000;
// How long images get to finish loading before a shot
const IMAGE_WAIT_MS = 4_000;
const SCREEN_QUALITY = 90;
// The full page as JPEG: WebP can't be taller than 16,383px. Smaller tries if it's over the limit.
const FULL_PAGE_TRIES = [
	{ quality: 80, scale: 1 },
	{ quality: 70, scale: 0.75 },
	{ quality: 60, scale: 0.5 }
];

export interface PageScreenshots {
	screen: Screenshot;
	// The whole page (or its slice), the screen outlined dashed and the selection solid
	page: Screenshot | null;
}

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

// Runs in the headless page: load every image (lazy ones never would off screen), then outline the
// screen (dashed) and the selection (solid) where they are on the page
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

async function shoot_full_page(
	headless: HeadlessPage,
	page: IssueReportPage,
	document_size: { width: number; height: number },
	// Where the headless page is scrolled, which is where the screen was
	scroll: { x: number; y: number }
): Promise<Screenshot | null> {
	const { selection } = page;
	await run_in_page(headless, prepare_full_page, {
		screen: { x: scroll.x, y: scroll.y, ...page.window.viewport },
		selection: selection && { ...selection, x: selection.x + scroll.x, y: selection.y + scroll.y },
		image_wait_ms: IMAGE_WAIT_MS
	});
	// This page may be shorter than the admin's (it loaded fresh), so the slice stays inside it
	const top = Math.min(
		page.full_page.top,
		Math.max(0, document_size.height - page.full_page.height)
	);
	const height = Math.min(page.full_page.height, document_size.height - top);
	for (const { quality, scale } of FULL_PAGE_TRIES) {
		const bytes = await headless.screenshot({
			type: 'jpeg',
			quality,
			clip: { x: 0, y: top, width: document_size.width, height, scale },
			captureBeyondViewport: true
		});
		if (bytes.byteLength <= MAX_SCREENSHOT_BYTES) {
			return { media_type: 'image/jpeg', base64: to_base64(bytes) };
		}
	}
	return null;
}

/**
 * The screen and the full page as the admin had them. The selection is cut from the screen by the
 * admin's browser, which knows where it was.
 */
export async function take_page_screenshots(
	page: IssueReportPage,
	{ site_host, cookie_header }: { site_host: string; cookie_header: string | null }
): Promise<PageScreenshots> {
	// Only ever this site: the browser carries the admin's cookies
	if (new URL(page.url).host !== site_host) error(400, 'Screenshots are only taken of this site');

	return with_headless_page(async (headless) => {
		const { viewport, device_pixel_ratio } = page.window;
		const emulation = { isMobile: page.browser.is_mobile, hasTouch: page.browser.is_touch };
		await headless.setViewport({
			...viewport,
			deviceScaleFactor: Math.min(device_pixel_ratio, MAX_SCALE),
			...emulation
		});
		await headless.setUserAgent(page.browser.user_agent);
		await headless.emulateMediaFeatures([
			{ name: 'prefers-color-scheme', value: page.color_scheme },
			{ name: 'prefers-reduced-motion', value: page.reduced_motion ? 'reduce' : 'no-preference' }
		]);
		const cookies = cookies_for(cookie_header, page.url);
		if (cookies.length > 0) await headless.setCookie(...cookies);
		try {
			await headless.goto(page.url, { waitUntil: 'networkidle2', timeout: LOAD_TIMEOUT_MS });
		} catch (load_error) {
			// Still busy (analytics, a video): what has loaded is shot anyway
			console.error(`The headless browser didn't finish loading ${page.url}`, load_error);
		}

		const settled = v.parse(
			settled_schema,
			await run_in_page(headless, settle_page, {
				scroll: page.scroll,
				anchor: page.anchor,
				image_wait_ms: IMAGE_WAIT_MS
			})
		);
		const screen_bytes = await headless.screenshot({
			type: 'webp',
			quality: SCREEN_QUALITY,
			captureBeyondViewport: false
		});
		const screen: Screenshot = { media_type: 'image/webp', base64: to_base64(screen_bytes) };

		// One pixel per CSS pixel for the full page: it's long, and only people look at it
		await headless.setViewport({ ...viewport, deviceScaleFactor: 1, ...emulation });
		let full_page: Screenshot | null = null;
		try {
			full_page = await shoot_full_page(headless, page, settled, settled.scroll);
		} catch (full_page_error) {
			console.error('The headless browser could not shoot the full page', full_page_error);
		}
		return { screen, page: full_page };
	});
}
