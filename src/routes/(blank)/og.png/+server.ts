import { dev } from '$app/environment';
import chrome from '@sparticuz/chromium';
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
    console.log(`launching browser` );
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

export async function GET({ url }) {
	const start = performance.now();
	const qs = new URLSearchParams(url.search);
	const show = qs.get('show');
  console.time(`Taking screenshot of ${show}`);
	const photoBuffer = await getScreenshot(`${url.origin}/og/${show}`);
  console.timeEnd(`Taking screenshot of ${show}`);
	const end = performance.now();
	console.log(`time to render ${show}:`, (end - start) / 1000);
	return new Response(photoBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      // cache for 1 second, allow stale for 1 more day
      'Cache-Control': 'public s-max-age=1, stale-while-revalidate=86400'
    }
  });
}
