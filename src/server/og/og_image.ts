// Share (OG) images: a screenshot of the /og/[show_number_or_title] page, taken with Cloudflare's
// browser (Browser Rendering) and kept in R2. Each image is keyed by a hash of what it shows, so it
// renders once, and a changed title or guest list gets a new image on its own.
import { dev } from '$app/env';
import { getRequestEvent } from '$app/server';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { add_timing } from '$server/server_timing';

// Part of every stored image's key. Bump it when ShowOg.svelte's look changes, so stored images
// are rendered again. 3: white text whatever the viewer's color scheme.
const OG_DESIGN_VERSION = 3;
const WIDTH = 1200;
const HEIGHT = 630;
// ShowOg.svelte adds this class once the title has been fitted
const READY_SELECTOR = '.finish-sizing-text';

// Everything ShowOg.svelte draws for a show
async function load_og_show(show_number: number) {
	const og_show = await db.query.show.findFirst({
		columns: { number: true, title: true, date: true },
		where: (show, { eq }) => eq(show.number, show_number),
		with: {
			guests: { columns: {}, with: { guest: { columns: { name: true, github: true } } } },
			hosts: { columns: {}, with: { profile: { columns: { name: true, username: true } } } }
		}
	});
	return og_show ?? null;
}

async function sha256_hex(text: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// The R2 key for a show number or a page title, or null for a show that doesn't exist
export async function og_image_key(show_number_or_title: string): Promise<string | null> {
	const show_number = Number(show_number_or_title);
	if (Number.isInteger(show_number) && show_number > 0) {
		const og_show = await edge_cached(
			`og-show-${show_number}`,
			{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
			() => load_og_show(show_number)
		);
		if (!og_show) return null;
		const show_hash = await sha256_hex(JSON.stringify(og_show));
		return `v${OG_DESIGN_VERSION}/shows/${show_number}-${show_hash.slice(0, 16)}.jpg`;
	}
	return `v${OG_DESIGN_VERSION}/pages/${(await sha256_hex(show_number_or_title)).slice(0, 32)}.jpg`;
}

async function screenshot_in_cloudflare(page_url: string): Promise<Uint8Array> {
	const { platform } = getRequestEvent();
	const binding = platform?.env.BROWSER;
	if (!binding) throw new Error('No BROWSER binding (alchemy.run.ts)');
	const { default: puppeteer } = await import('@cloudflare/puppeteer');
	const browser = await puppeteer.launch(binding);
	try {
		const page = await browser.newPage();
		await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
		await page.goto(page_url);
		await page.waitForSelector(READY_SELECTOR, { timeout: 10_000 });
		return new Uint8Array(await page.screenshot({ type: 'jpeg' }));
	} finally {
		await browser.close();
	}
}

// `pnpm dev` (Node) has no Browser Rendering, so it uses the Chrome installed on this Mac
async function screenshot_with_local_chrome(page_url: string): Promise<Uint8Array> {
	const { default: puppeteer } = await import('puppeteer-core');
	const browser = await puppeteer.launch({
		executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		headless: true
	});
	try {
		const page = await browser.newPage();
		await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
		await page.goto(page_url);
		await page.waitForSelector(READY_SELECTOR, { timeout: 10_000 });
		return new Uint8Array(await page.screenshot({ type: 'jpeg' }));
	} finally {
		await browser.close();
	}
}

// The stored image if there is one; otherwise render it, store it, and return it
export async function get_og_image(key: string, page_url: string): Promise<Uint8Array> {
	const event = getRequestEvent();
	const bucket = event.platform?.env.OG_IMAGES;

	const stored = await bucket?.get(key);
	if (stored) {
		add_timing(event, 'og-stored', 0);
		return new Uint8Array(await stored.arrayBuffer());
	}

	const start = performance.now();
	const image = dev
		? await screenshot_with_local_chrome(page_url)
		: await screenshot_in_cloudflare(page_url);
	add_timing(event, 'og-render', performance.now() - start);

	if (bucket) {
		const saved = bucket
			.put(key, image, { httpMetadata: { contentType: 'image/jpeg' } })
			.catch((save_error: unknown) => console.error(`Could not store OG image ${key}`, save_error));
		event.platform?.ctx?.waitUntil(saved);
	}
	return image;
}
