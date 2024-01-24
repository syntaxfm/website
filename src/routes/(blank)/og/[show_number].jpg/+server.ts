import { dev } from '$app/environment';
import chrome from '@sparticuz/chromium';
import puppeteer, { Browser, type Product } from 'puppeteer-core';
import { redis } from '../../../../hooks.server.js';
const exePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function getOptions() {
	if (dev) {
		return {
			product: 'chrome' as Product,
			args: [],
			executablePath: exePath,
			headless: true
		};
	}
	return {
		product: 'chrome' as Product,
		args: chrome.args,
		executablePath: await chrome.executablePath(),
		headless: chrome.headless
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
	await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
	await page.goto(url);
	await page.waitForSelector('.finish-sizing-text');
	const buffer = await page.screenshot({ type: 'jpeg' });
	return buffer;
}

export const config = {
	maxDuration: 30 // vercel timeout 30s
};

const headers = {
	'Content-Type': 'image/jpeg',
	// cache for 10 minutes, allow stale to be served for up for another 10 mins
	'cache-control': 'public s-max-age=600, stale-while-revalidate=600'
};

export async function GET({ url, params }) {
	const start = performance.now();
	// const qs = new URLSearchParams(url.search);
	// const show = qs.get('show');
	const show = params.show_number;

	// Check if we have a cached version
	const cache: string = redis ? (await redis.get(`show-og-${show}`)) || '' : '';
	if (cache) {
		console.log(`serving cached version of ${show}`, cache);
		return new Response(Buffer.from(cache, 'base64'), {
			status: 200,
			headers
		});
	}
	console.time(`Taking screenshot of ${show}`);
	const photoBuffer = await getScreenshot(`${url.origin}/og/${show}`);
	console.timeEnd(`Taking screenshot of ${show}`);
	const end = performance.now();
	console.log(`time to render ${show}:`, (end - start) / 1000);
	// Store buffer in cache
	console.log(`caching ${show} in redis`);
	redis?.set(`show-og-${show}`, photoBuffer.toString('base64'), {
		ex: 60 * 60 * 5
	});

	return new Response(photoBuffer, {
		status: 200,
		headers
	});
}
