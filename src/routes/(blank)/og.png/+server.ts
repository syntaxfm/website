import { dev } from '$app/environment';
import chrome from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';
const cached = new Map();
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
	// first check if this value has been cached
	const cachedImage = cached.get(url);
	if (cachedImage) {
		return cachedImage;
	}
	const options = await getOptions();
	// We load the browser outside the handler so we can re-use a warm instance
	if (!browser) {
		browser = await puppeteer.launch(options);
	}

	const page = await browser.newPage();
	await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
	await page.goto(url);
	await page.waitForSelector('.finish-sizing-text');
	const buffer = await page.screenshot({ type: 'png' });
	return buffer;
}

export async function GET({ url }) {
	const start = performance.now();
	const qs = new URLSearchParams(url.search);
	const show = qs.get('show');
	const photoBuffer = await getScreenshot(`${url.origin}/og/${show}`);
	const end = performance.now();
	console.log(`time to render ${show}:`, (end - start) / 1000);
	return new Response(photoBuffer, { status: 200 });
}
