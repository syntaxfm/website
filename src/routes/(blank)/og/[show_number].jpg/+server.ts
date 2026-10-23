import { dev } from '$app/env';
import chrome from '@sparticuz/chromium';
import puppeteer, { type Browser } from 'puppeteer-core';
import { redis } from '#hooks.server';
const exe_path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

chrome.setGraphicsMode = true;

async function getOptions() {
	if (dev) {
		return {
			args: [],
			executablePath: exe_path,
			headless: true
		};
	}
	return {
		args: await puppeteer.defaultArgs({ args: chrome.args, headless: 'shell' }),
		executablePath: await chrome.executablePath(),
		headless: 'shell' as const
	};
}

let browser: Browser | null = null;

async function getScreenshot(url: string) {
	const options = await getOptions();
	console.time(`launching browser`);
	// We load the browser outside the handler so we can re-use a warm instance
	if (!browser) {
		console.log(`launching browser`);
		browser = await puppeteer.launch(options);
	}
	console.timeEnd(`launching browser`);

	console.log(`creating new page`);
	const page = await browser.newPage();
	try {
		await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
		await page.goto(url);
		await page.waitForSelector('.finish-sizing-text');
		return await page.screenshot({ type: 'jpeg' });
	} finally {
		await page.close();
	}
}

export const config = {
	maxDuration: 30 // vercel timeout 30s
};

const headers = {
	'Content-Type': 'image/jpeg',
	// cache for 10 minutes, allow stale to be served for up for another 10 mins
	'cache-control': 'public, s-maxage=600, stale-while-revalidate=600'
};

export async function GET({ url, params }) {
	const start = performance.now();
	// const qs = new URLSearchParams(url.search);
	// const show = qs.get('show');
	const show = params.show_number;

	// Check if we have a cached version
	const cache: string = redis ? (await redis.get(`show-og-${show}`)) || '' : '';
	if (cache) {
		console.log(`serving cached version of ${show}`, `${cache.slice(0, 20)}…`);
		return new Response(Buffer.from(cache, 'base64'), {
			status: 200,
			headers
		});
	}
	console.time(`Taking screenshot of ${show}`);
	const photo_buffer = await getScreenshot(`${url.origin}/og/${show}`);
	console.timeEnd(`Taking screenshot of ${show}`);
	const end = performance.now();
	console.log(`time to render ${show}:`, (end - start) / 1000);
	// Store buffer in cache
	console.log(`caching ${show} in redis`);

	redis?.set(`show-og-${show}`, Buffer.from(photo_buffer).toString('base64'), { ex: 60 * 60 * 5 });

	return new Response(new Uint8Array(photo_buffer), { status: 200, headers });
}
