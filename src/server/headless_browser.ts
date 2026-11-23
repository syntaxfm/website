// A headless Chrome for screenshots: Cloudflare's Browser Rendering (the BROWSER binding,
// alchemy.run.ts) on the Worker, and the Chrome installed on this Mac under `pnpm dev`, which has no
// Browser Rendering. Share images (og/og_image.ts) use a page for one request; issue report
// screenshots (issue_reports/page_screenshots.ts) keep one open across a few.
import type { Browser as CloudflareBrowser } from '@cloudflare/puppeteer';
import type { Browser as LocalBrowser } from 'puppeteer-core';
import { dev } from '$app/env';
import { getRequestEvent } from '$app/server';

const LOCAL_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// A kept page's browser closes after this long unused (Cloudflare's own default)
const KEPT_PAGE_IDLE_MS = 60_000;

// What callers use of a page. Both Puppeteers' pages have it; neither's types fit the other.
export interface HeadlessPage {
	setViewport(viewport: {
		width: number;
		height: number;
		deviceScaleFactor?: number;
		isMobile?: boolean;
		hasTouch?: boolean;
	}): Promise<void>;
	setUserAgent(user_agent: string): Promise<void>;
	emulateMediaFeatures(features: { name: string; value: string }[]): Promise<void>;
	setCookie(...cookies: { name: string; value: string; url: string }[]): Promise<void>;
	goto(
		url: string,
		options?: { waitUntil?: 'load' | 'networkidle2'; timeout?: number }
	): Promise<unknown>;
	waitForSelector(selector: string, options?: { timeout?: number }): Promise<unknown>;
	// A script; run_in_page builds one from a function
	evaluate(script: string): Promise<unknown>;
	screenshot(options: {
		type: 'jpeg' | 'png' | 'webp';
		quality?: number;
		clip?: { x: number; y: number; width: number; height: number; scale?: number };
		captureBeyondViewport?: boolean;
	}): Promise<Uint8Array>;
}

/**
 * Runs `page_function` in the page with `input`, which travels as JSON. The function is sent as
 * source, so it can't use anything from around it, and it mustn't name functions inside itself
 * (`const check = () => …`): bundlers that keep names, like the one Cloudflare deploys use, wrap
 * those in a helper the page doesn't have. What it returns comes back unchecked.
 */
export function run_in_page<Input>(
	page: HeadlessPage,
	page_function: (input: Input) => unknown,
	input: Input
): Promise<unknown> {
	return page.evaluate(`(${page_function.toString()})(${JSON.stringify(input)})`);
}

async function launch_local_browser(): Promise<LocalBrowser> {
	const { default: puppeteer } = await import('puppeteer-core');
	return puppeteer.launch({ executablePath: LOCAL_CHROME, headless: true });
}

async function cloudflare_browsers() {
	const binding = getRequestEvent().platform?.env.BROWSER;
	if (!binding) throw new Error('No BROWSER binding (alchemy.run.ts)');
	const { default: puppeteer } = await import('@cloudflare/puppeteer');
	return { puppeteer, binding };
}

/** Opens a page in a fresh headless browser, hands it to `use`, and closes the browser after. */
export async function with_headless_page<T>(use: (page: HeadlessPage) => Promise<T>): Promise<T> {
	if (dev) {
		const browser = await launch_local_browser();
		try {
			return await use(await browser.newPage());
		} finally {
			await browser.close();
		}
	}

	const { puppeteer, binding } = await cloudflare_browsers();
	const browser = await puppeteer.launch(binding);
	try {
		return await use(await browser.newPage());
	} finally {
		await browser.close();
	}
}

// --- Kept pages: open across requests ---

// What one request holds of a kept page's browser
interface KeptBrowser {
	id: string;
	page: HeadlessPage;
	// Leaves the browser open for the next request, or closes it
	release(should_close: boolean): Promise<void>;
}

// `pnpm dev` keeps its browsers here, by id. Cloudflare keeps its own, as sessions.
const local_kept_browsers = new Map<
	string,
	{ browser: LocalBrowser; idle_timer: ReturnType<typeof setTimeout> }
>();

// A browser opens with a blank tab: that's the kept page
async function first_page<Page>(browser: {
	pages(): Promise<Page[]>;
	newPage(): Promise<Page>;
}): Promise<Page> {
	const [page] = await browser.pages();
	return page ?? browser.newPage();
}

async function keep_local_browser(id: string, browser: LocalBrowser): Promise<KeptBrowser> {
	return {
		id,
		page: await first_page(browser),
		async release(should_close) {
			if (should_close) {
				await browser.close();
				return;
			}
			const idle_timer = setTimeout(() => {
				local_kept_browsers.delete(id);
				void browser.close();
			}, KEPT_PAGE_IDLE_MS);
			local_kept_browsers.set(id, { browser, idle_timer });
		}
	};
}

async function keep_cloudflare_browser(browser: CloudflareBrowser): Promise<KeptBrowser> {
	return {
		id: browser.sessionId(),
		page: await first_page(browser),
		// Cloudflare closes a disconnected browser itself once it's been unused for keep_alive
		release: (should_close) => (should_close ? browser.close() : browser.disconnect())
	};
}

async function find_kept_browser(id: string): Promise<KeptBrowser | null> {
	if (dev) {
		const kept = local_kept_browsers.get(id);
		if (!kept) return null;
		clearTimeout(kept.idle_timer);
		local_kept_browsers.delete(id);
		return keep_local_browser(id, kept.browser);
	}
	const { puppeteer, binding } = await cloudflare_browsers();
	try {
		return await keep_cloudflare_browser(await puppeteer.connect(binding, id));
	} catch (connect_error) {
		console.warn(`The kept headless browser ${id} has closed, so a new one opens`, connect_error);
		return null;
	}
}

async function launch_kept_browser(): Promise<KeptBrowser> {
	if (dev) return keep_local_browser(crypto.randomUUID(), await launch_local_browser());
	const { puppeteer, binding } = await cloudflare_browsers();
	return keep_cloudflare_browser(
		await puppeteer.launch(binding, { keep_alive: KEPT_PAGE_IDLE_MS })
	);
}

/**
 * A page kept open between requests, so one request can load it and later ones use it. `id` finds
 * it again. Without one, or once it's gone (unused for a minute), a new browser opens and `load`
 * runs first. Returns the id for next time. `should_close` closes it after `use`, as an error does.
 */
export async function with_kept_page<T>(
	id: string | null,
	{
		load,
		use,
		should_close
	}: {
		load: (page: HeadlessPage) => Promise<void>;
		use: (page: HeadlessPage) => Promise<T>;
		should_close: boolean;
	}
): Promise<{ id: string; result: T }> {
	const found = id === null ? null : await find_kept_browser(id);
	const kept = found ?? (await launch_kept_browser());
	let is_finished = should_close;
	try {
		if (!found) await load(kept.page);
		return { id: kept.id, result: await use(kept.page) };
	} catch (use_error) {
		is_finished = true;
		throw use_error;
	} finally {
		await kept.release(is_finished);
	}
}
