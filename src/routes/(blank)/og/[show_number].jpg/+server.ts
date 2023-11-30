import { dev } from '$app/environment';
import chrome from '@sparticuz/chromium';
import { readFile } from 'fs/promises';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer-core';
const exePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function getOptions() {
	if (dev) {
		return {
			product: 'chrome',
			args: [],
			executablePath: exePath,
			headless: true
		};
	}
	return {
		product: 'chrome',
		args: chrome.args,
		executablePath: await chrome.executablePath(),
		headless: chrome.headless
	};
}

let browser: Browser | null = null;

async function getScreenshot(url) {
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

export async function GET({ url, params }) {
	const buf = await fetch(
		'https://p201.p0.n0.cdn.getcloudapp.com/items/4guRB0vd/9dfc34a6-c197-4f10-b44d-e2c049824584.jpg?source=viewer&v=7dbdaa80953a2cf83f6b2caf6f5b5cea'
	).then((x) => x.arrayBuffer());
	return new Response(buf, {
		status: 200,
		headers: {
			'Content-Type': 'image/jpeg',
			// cache for 10 minutes, allow stale to be served for up for another 10 mins
			'cache-control': 'public s-max-age=600, stale-while-revalidate=600'
		}
	});

	const start = performance.now();
	const qs = new URLSearchParams(url.search);
	// const show = qs.get('show');
	const show = params.show_number;

	console.time(`Taking screenshot of ${show}`);
	const photoBuffer = await getScreenshot(`${url.origin}/og/${show}`);
	console.timeEnd(`Taking screenshot of ${show}`);
	const end = performance.now();
	console.log(`time to render ${show}:`, (end - start) / 1000);
	return new Response(photoBuffer, {
		status: 200,
		headers: {
			'Content-Type': 'image/jpeg',
			// cache for 10 minutes, allow stale to be served for up for another 10 mins
			'cache-control': 'public s-max-age=600, stale-while-revalidate=600'
		}
	});
}
