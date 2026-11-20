// What the Report button captures in the browser: screenshots (drawn from the page itself, so they
// work on phones too), the elements in the selected area, and facts about the page, the window and
// the browser.
import { domToCanvas } from 'modern-screenshot';
import { browser_name, type ClientHints } from './browser_name';
import { proxied_image_url } from './image_proxy';
import {
	MAX_SCREENSHOT_BYTES,
	type IssueReportPage,
	type PageElement,
	type PageError,
	type Screenshot,
	type ScreenshotMediaType,
	type ViewportRect
} from './issue_report_schema';

// Anything smaller is a click, which reports the whole screen
const MIN_SELECTION_SIZE = 8;
const MAX_ELEMENTS = 12;
// Points sampled per side of the selection, to find the elements in it
const MAX_SAMPLES_PER_SIDE = 6;
const SAMPLE_SPACING = 80;
// Svelte's scoped-style classes (svelte-1a2b3c) say nothing about the element
const SVELTE_SCOPE_CLASS = /^svelte-[a-z0-9]+$/;

// The reporter's own overlay and dialog carry `data-issue-reporter`, so they stay out of the
// screenshots
const REPORTER_ATTRIBUTE = 'data-issue-reporter';
// Sharp enough for text on any screen, without making phone screenshots huge
const MAX_SCREEN_SCALE = 2;
// iOS Safari won't draw a canvas bigger than this many pixels, nor (anywhere) this wide or tall
const MAX_CANVAS_AREA = 16_777_216;
const MAX_CANVAS_SIDE = 16_384;
// How long drawing waits for the page's images to finish loading, and for an asset to download.
// Lazy images further down never load until scrolled to, so every draw waits this long for them.
// Other sites' images come through the proxy, which has its own wait.
const RENDER_TIMEOUT_MS = 2_000;
// Taller pages get the slice around the screen: past this the image is too thin to read, and
// phones run out of memory drawing it
const MAX_FULL_PAGE_HEIGHT = 16_384;
// PNG keeps text sharp; photo-heavy shots are smaller as WebP or JPEG
const MAX_PNG_BYTES = 1.5 * 1024 * 1024;
// Drawn on the full page: the selection solid, the screen dashed. A canvas color, not CSS.
const OUTLINE_COLOR = '#ff2d55';

type Point = { x: number; y: number };
type Size = { width: number; height: number };

export function rect_between(start: Point, end: Point): ViewportRect {
	return {
		x: Math.min(start.x, end.x),
		y: Math.min(start.y, end.y),
		width: Math.abs(end.x - start.x),
		height: Math.abs(end.y - start.y)
	};
}

export function is_click(rect: ViewportRect): boolean {
	return rect.width < MIN_SELECTION_SIZE && rect.height < MIN_SELECTION_SIZE;
}

function clip(text: string, max_length: number): string {
	return text.length > max_length ? `${text.slice(0, max_length - 1)}…` : text;
}

/** `tag#id.class.class`, without Svelte's scoped-style classes */
export function element_name(element: Element): string {
	const id = element.id ? `#${element.id}` : '';
	const classes = [...element.classList]
		.filter((name) => !SVELTE_SCOPE_CLASS.test(name))
		.slice(0, 3)
		.map((name) => `.${name}`)
		.join('');
	return `${element.localName}${id}${classes}`;
}

/** The element with up to two ancestors for context, e.g. `section.feed > article.card > h2` */
export function element_selector(element: Element): string {
	const names = [element_name(element)];
	let ancestor = element.parentElement;
	while (ancestor && names.length < 3 && ancestor !== document.body) {
		names.unshift(element_name(ancestor));
		ancestor = ancestor.parentElement;
	}
	return names.join(' > ');
}

function element_text(element: Element): string {
	const text =
		element instanceof HTMLImageElement
			? element.alt
			: (element.textContent ?? '').replace(/\s+/g, ' ').trim();
	return clip(text, 120);
}

// In development Svelte marks each element with where its markup is: __svelte_meta.loc
function svelte_source(element: Element): string | null {
	let current: Element | null = element;
	while (current) {
		const meta: unknown = Reflect.get(current, '__svelte_meta');
		if (typeof meta === 'object' && meta !== null && 'loc' in meta) {
			const loc: unknown = meta.loc;
			if (typeof loc === 'object' && loc !== null && 'file' in loc && 'line' in loc) {
				const column = 'column' in loc ? `:${String(loc.column)}` : '';
				return clip(`${String(loc.file)}:${String(loc.line)}${column}`, 300);
			}
		}
		current = current.parentElement;
	}
	return null;
}

function describe(element: Element, kind: PageElement['kind']): PageElement {
	return {
		kind,
		selector: clip(element_selector(element), 300),
		text: kind === 'area' ? '' : element_text(element),
		source: svelte_source(element)
	};
}

/** The topmost elements across the area, led by the smallest element that holds them all */
export function elements_in_rect(rect: ViewportRect): PageElement[] {
	const columns = Math.min(
		MAX_SAMPLES_PER_SIDE,
		Math.max(2, Math.ceil(rect.width / SAMPLE_SPACING))
	);
	const rows = Math.min(MAX_SAMPLES_PER_SIDE, Math.max(2, Math.ceil(rect.height / SAMPLE_SPACING)));
	const found = new Set<Element>();
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			const element = document.elementFromPoint(
				rect.x + ((column + 0.5) * rect.width) / columns,
				rect.y + ((row + 0.5) * rect.height) / rows
			);
			if (element && element !== document.documentElement && element !== document.body) {
				found.add(element);
			}
		}
	}

	const elements = [...found];
	if (elements.length === 0) return [];
	let area: Element | null = elements[0];
	while (area && !elements.every((element) => area?.contains(element))) {
		area = area.parentElement;
	}

	const described = elements.slice(0, MAX_ELEMENTS).map((element) => describe(element, 'element'));
	const is_page = area === document.body || area === document.documentElement;
	return area && !found.has(area) && !is_page ? [describe(area, 'area'), ...described] : described;
}

export function page_error_from(event: ErrorEvent | PromiseRejectionEvent): PageError {
	const at = new Date().toISOString();
	if (event instanceof PromiseRejectionEvent) {
		const reason: unknown = event.reason;
		const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
		return { message: clip(`Unhandled rejection: ${message}`, 500), source: null, at };
	}
	return {
		message: clip(event.message || String(event.error), 500),
		source: event.filename ? clip(`${event.filename}:${event.lineno}:${event.colno}`, 300) : null,
		at
	};
}

// User-Agent Client Hints, which only Chromium browsers have
function client_hints(): ClientHints | null {
	const data: unknown = Reflect.get(navigator, 'userAgentData');
	if (typeof data !== 'object' || data === null) return null;
	if (!('brands' in data) || !Array.isArray(data.brands)) return null;
	const brands = data.brands.filter(
		(entry): entry is ClientHints['brands'][number] =>
			typeof entry === 'object' &&
			entry !== null &&
			typeof Reflect.get(entry, 'brand') === 'string' &&
			typeof Reflect.get(entry, 'version') === 'string'
	);
	return {
		brands,
		mobile: 'mobile' in data && data.mobile === true,
		platform: 'platform' in data && typeof data.platform === 'string' ? data.platform : ''
	};
}

/** The rows a full-page screenshot covers: the whole page, or a slice centered on the screen */
export function full_page_rows(
	scroll_y: number,
	viewport_height: number,
	document_height: number
): IssueReportPage['full_page'] {
	if (document_height <= MAX_FULL_PAGE_HEIGHT) return { top: 0, height: document_height };
	const centered = scroll_y + viewport_height / 2 - MAX_FULL_PAGE_HEIGHT / 2;
	const top = Math.round(Math.min(Math.max(0, centered), document_height - MAX_FULL_PAGE_HEIGHT));
	return { top, height: MAX_FULL_PAGE_HEIGHT };
}

/** Everything about the page right now. Taken while the selection still matches the layout. */
export function collect_page({
	route_id,
	selection,
	errors
}: {
	route_id: string | null;
	selection: ViewportRect | null;
	errors: PageError[];
}): IssueReportPage {
	const viewport = { width: innerWidth, height: innerHeight };
	const document_size = {
		width: document.documentElement.scrollWidth,
		height: document.documentElement.scrollHeight
	};
	const scroll = { x: Math.round(scrollX), y: Math.round(scrollY) };
	const hints = client_hints();
	const is_touch = navigator.maxTouchPoints > 0;
	return {
		url: location.href,
		route_id,
		title: clip(document.title, 300),
		captured_at: new Date().toISOString(),
		window: {
			viewport,
			visual_viewport: visualViewport
				? {
						width: Math.round(visualViewport.width),
						height: Math.round(visualViewport.height),
						scale: visualViewport.scale
					}
				: null,
			outer: { width: outerWidth, height: outerHeight },
			screen: {
				width: screen.width,
				height: screen.height,
				orientation: screen.orientation?.type ?? null
			},
			document: document_size,
			device_pixel_ratio: devicePixelRatio
		},
		scroll,
		full_page: full_page_rows(scroll.y, viewport.height, document_size.height),
		selection,
		browser: {
			name: clip(browser_name(navigator.userAgent, hints, navigator.maxTouchPoints), 150),
			user_agent: clip(navigator.userAgent, 500),
			is_mobile: hints?.mobile ?? /Mobi|Android|iPhone|iPod/.test(navigator.userAgent),
			is_touch,
			language: navigator.language,
			time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
		},
		color_scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
		theme:
			[...document.documentElement.classList].find((name) => name.startsWith('theme-')) ?? null,
		reduced_motion: matchMedia('(prefers-reduced-motion: reduce)').matches,
		elements: elements_in_rect(selection ?? { x: 0, y: 0, ...viewport }),
		errors
	};
}

// --- Screenshots ---

/** The largest scale up to `wanted` at which a canvas this size can still be drawn */
export function fit_scale({ width, height }: Size, wanted: number): number {
	return Math.min(
		wanted,
		Math.sqrt(MAX_CANVAS_AREA / (width * height)),
		MAX_CANVAS_SIDE / width,
		MAX_CANVAS_SIDE / height
	);
}

function is_transparent(color: string): boolean {
	return color === 'transparent' || /^rgba\(.*,\s*0\)$/.test(color);
}

// The color behind the page, so the screenshots aren't transparent where the page is
function page_background(): string {
	for (const element of [document.body, document.documentElement]) {
		const color = getComputedStyle(element).backgroundColor;
		if (!is_transparent(color)) return color;
	}
	// Nothing paints it, so the page shows the browser's own color for its light or dark scheme
	const probe = document.createElement('div');
	probe.style.backgroundColor = 'Canvas';
	document.documentElement.append(probe);
	const canvas_color = getComputedStyle(probe).backgroundColor;
	probe.remove();
	return canvas_color;
}

function is_reporter(node: Node): boolean {
	return node instanceof Element && node.hasAttribute(REPORTER_ATTRIBUTE);
}

export interface Rendered {
	canvas: HTMLCanvasElement;
	// Canvas pixels per CSS pixel
	scale: number;
}

function read_data_url(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error ?? new Error('Could not read the image'));
		reader.readAsDataURL(blob);
	});
}

// Other sites' images the browser won't share with the page come through the admin image proxy.
// False: fetch it as usual.
async function fetch_through_proxy(url: string): Promise<string | false> {
	const proxied = proxied_image_url(url);
	if (!proxied) return false;
	try {
		const response = await fetch(proxied);
		return response.ok ? await read_data_url(await response.blob()) : false;
	} catch (proxy_error) {
		console.error(`Could not read ${url} through the image proxy`, proxy_error);
		return false;
	}
}

/**
 * The outermost elements wholly above or below the rows. Drawing keeps their boxes, so nothing
 * moves, but skips what's inside them: a long page then draws (and fetches images for) only the
 * part that shows. Empty boxes (display: contents) are looked inside.
 */
function elements_outside(top: number, height: number): WeakSet<Element> {
	const outside = new WeakSet<Element>();
	const bottom = top + height;
	const visit = (parent: Element) => {
		for (const child of parent.children) {
			const rect = child.getBoundingClientRect();
			const child_top = rect.top + scrollY;
			const is_empty_box = rect.width === 0 && rect.height === 0;
			if (!is_empty_box && (child_top >= bottom || child_top + rect.height <= top)) {
				outside.add(child);
			} else {
				visit(child);
			}
		}
	};
	visit(document.body);
	return outside;
}

// modern-screenshot fills its canvas with the background, but on Safari and Firefox it clears and
// redraws the page to get images decoded, which wipes the fill: lay the drawing over it again
function on_background(canvas: HTMLCanvasElement, color: string): HTMLCanvasElement {
	const filled = document.createElement('canvas');
	filled.width = canvas.width;
	filled.height = canvas.height;
	const context = filled.getContext('2d');
	if (!context) return canvas;
	context.fillStyle = color;
	context.fillRect(0, 0, filled.width, filled.height);
	context.drawImage(canvas, 0, 0);
	return filled;
}

function is_fixed(node: Node): boolean {
	return node instanceof Element && getComputedStyle(node).position === 'fixed';
}

/**
 * Draws the rows from `top` down, `size` big. The body is pulled up by `top`, so position: fixed
 * elements land where they'd be in a window that size, unless `without_fixed` leaves them out.
 */
async function render_rows(
	size: Size,
	{
		top,
		left,
		scale: wanted_scale,
		without_fixed
	}: Record<'top' | 'left' | 'scale', number> & {
		without_fixed: boolean;
	}
): Promise<Rendered> {
	const scale = fit_scale(size, wanted_scale);
	const outside = elements_outside(top, size.height);
	const background = page_background();
	const drawn = await domToCanvas(document.body, {
		...size,
		scale,
		backgroundColor: background,
		style: { marginTop: `${-top}px`, marginLeft: `${-left}px` },
		filter: (node) =>
			!is_reporter(node) &&
			!(node.parentElement && outside.has(node.parentElement)) &&
			!(without_fixed && is_fixed(node)),
		fetchFn: fetch_through_proxy,
		timeout: RENDER_TIMEOUT_MS
	});
	return { canvas: on_background(drawn, background), scale };
}

/** The visible screen, fixed bars included */
export function render_screen(page: IssueReportPage): Promise<Rendered> {
	const size = { width: document.documentElement.clientWidth, height: page.window.viewport.height };
	return render_rows(size, {
		top: page.scroll.y,
		left: page.scroll.x,
		scale: Math.min(page.window.device_pixel_ratio, MAX_SCREEN_SCALE),
		without_fixed: false
	});
}

/**
 * The whole page (or its slice around the screen), at most 1 canvas pixel per CSS pixel. Fixed
 * bars (the player) are left out: they'd land over the top of the page, and the screen has them.
 */
export function render_page(page: IssueReportPage): Promise<Rendered> {
	const size = { width: page.window.document.width, height: page.full_page.height };
	return render_rows(size, {
		top: page.full_page.top,
		left: 0,
		scale: Math.min(page.window.device_pixel_ratio, 1),
		without_fixed: true
	});
}

/** Part of a rendered canvas, in CSS pixels */
export function crop({ canvas, scale }: Rendered, rect: ViewportRect): HTMLCanvasElement {
	const x = Math.max(0, Math.round(rect.x * scale));
	const y = Math.max(0, Math.round(rect.y * scale));
	const width = Math.max(1, Math.min(canvas.width - x, Math.round(rect.width * scale)));
	const height = Math.max(1, Math.min(canvas.height - y, Math.round(rect.height * scale)));
	const cropped = document.createElement('canvas');
	cropped.width = width;
	cropped.height = height;
	cropped.getContext('2d')?.drawImage(canvas, x, y, width, height, 0, 0, width, height);
	return cropped;
}

/** Marks where the screen (dashed) and the selection (solid) were on the full page */
export function outline_on_page({ canvas, scale }: Rendered, page: IssueReportPage): void {
	const context = canvas.getContext('2d');
	if (!context) return;
	const line = Math.max(2, Math.round(3 * scale));
	context.strokeStyle = OUTLINE_COLOR;
	context.lineWidth = line;
	const x = page.scroll.x;
	const y = page.scroll.y - page.full_page.top;
	const { width, height } = page.window.viewport;
	context.setLineDash([line * 4, line * 3]);
	context.strokeRect(x * scale, y * scale, width * scale, height * scale);
	if (page.selection) {
		context.setLineDash([]);
		const selected = page.selection;
		context.strokeRect(
			(x + selected.x) * scale,
			(y + selected.y) * scale,
			selected.width * scale,
			selected.height * scale
		);
	}
}

function canvas_blob(canvas: HTMLCanvasElement, type: string, quality?: number) {
	return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function scaled_down(canvas: HTMLCanvasElement, factor: number): HTMLCanvasElement {
	const smaller = document.createElement('canvas');
	smaller.width = Math.max(1, Math.round(canvas.width * factor));
	smaller.height = Math.max(1, Math.round(canvas.height * factor));
	smaller.getContext('2d')?.drawImage(canvas, 0, 0, smaller.width, smaller.height);
	return smaller;
}

async function blob_to_base64(blob: Blob): Promise<string> {
	const data_url = await read_data_url(blob);
	return data_url.slice(data_url.indexOf(',') + 1);
}

/**
 * The screen and the selection on it. `preview` shows in the dialog: the selection, or the screen
 * after a click.
 */
export async function screen_screenshots(page: IssueReportPage): Promise<{
	selection: Screenshot | null;
	screen: Screenshot;
	preview: Blob;
}> {
	const rendered = await render_screen(page);
	const screen = await encode_screenshot(rendered.canvas, 'sharp');
	if (!page.selection) return { selection: null, screen: screen.screenshot, preview: screen.blob };
	const selection = await encode_screenshot(crop(rendered, page.selection), 'sharp');
	return { selection: selection.screenshot, screen: screen.screenshot, preview: selection.blob };
}

/** The whole page with the screen and selection outlined, or null when it can't be drawn */
export async function full_page_screenshot(page: IssueReportPage): Promise<Screenshot | null> {
	try {
		const rendered = await render_page(page);
		outline_on_page(rendered, page);
		return (await encode_screenshot(rendered.canvas, 'photo')).screenshot;
	} catch (render_error) {
		console.error('Could not draw the full page for the issue report', render_error);
		return null;
	}
}

/**
 * The smallest good-looking file under the size limit. `sharp` (selections, screens) tries PNG
 * first; the full page goes straight to WebP or JPEG. Scales down until it fits.
 */
export async function encode_screenshot(
	canvas: HTMLCanvasElement,
	kind: 'sharp' | 'photo'
): Promise<{ screenshot: Screenshot; blob: Blob }> {
	type Attempt = [ScreenshotMediaType, number | undefined, number];
	const lossy: Attempt[] = [
		['image/webp', 0.85, MAX_SCREENSHOT_BYTES],
		['image/jpeg', 0.8, MAX_SCREENSHOT_BYTES]
	];
	const png: Attempt = ['image/png', undefined, MAX_PNG_BYTES];
	const attempts = kind === 'sharp' ? [png, ...lossy] : lossy;
	let source = canvas;
	for (let shrink = 0; shrink < 4; shrink++) {
		for (const [media_type, quality, max_bytes] of attempts) {
			const blob = await canvas_blob(source, media_type, quality);
			// A browser that can't write the type hands back a PNG instead
			if (blob && blob.type === media_type && blob.size <= max_bytes) {
				return { screenshot: { media_type, base64: await blob_to_base64(blob) }, blob };
			}
		}
		source = scaled_down(source, 0.7);
	}
	throw new Error('The screenshot is too big to send, even scaled down');
}
