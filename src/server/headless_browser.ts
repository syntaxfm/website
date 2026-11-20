// A headless Chrome for screenshots: Cloudflare's Browser Rendering (the BROWSER binding,
// alchemy.run.ts) on the Worker, and the Chrome installed on this Mac under `pnpm dev`, which has no
// Browser Rendering. Share images (og/og_image.ts) and issue report screenshots
// (issue_reports/page_screenshots.ts) use it.
import { dev } from '$app/env';
import { getRequestEvent } from '$app/server';

const LOCAL_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

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

/** Opens a page in a fresh headless browser, hands it to `use`, and closes the browser after. */
export async function with_headless_page<T>(use: (page: HeadlessPage) => Promise<T>): Promise<T> {
	if (dev) {
		const { default: puppeteer } = await import('puppeteer-core');
		const browser = await puppeteer.launch({ executablePath: LOCAL_CHROME, headless: true });
		try {
			return await use(await browser.newPage());
		} finally {
			await browser.close();
		}
	}

	const binding = getRequestEvent().platform?.env.BROWSER;
	if (!binding) throw new Error('No BROWSER binding (alchemy.run.ts)');
	const { default: puppeteer } = await import('@cloudflare/puppeteer');
	const browser = await puppeteer.launch(binding);
	try {
		return await use(await browser.newPage());
	} finally {
		await browser.close();
	}
}
