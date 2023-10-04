import { dev } from '$app/environment';
import chrome from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import wait from 'waait';

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

async function getScreenshot(url) {
	// first check if this value has been cached
	const cachedImage = cached.get(url);
	if (cachedImage) {
		return cachedImage;
	}
	const options = await getOptions();
	const browser = await puppeteer.launch(options);
	const page = await browser.newPage();
	await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
	await page.goto(url);
	await wait(1000);
	const buffer = await page.screenshot({ type: 'png' });
	return buffer;
}

export async function GET({ url }) {
	console.log('request', url);
	const qs = new URLSearchParams(url.search);
	const show = qs.get('show');
	const photoBuffer = await getScreenshot(`${url.origin}/og/${show}`);
	return new Response(photoBuffer, { status: 200 });

	// return {
	// 	statusCode: 200,
	// 	body: photoBuffer,
	// 	isBase64Encoded: true
	// };
}
