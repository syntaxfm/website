// What the Report button captures in the browser: the selected area, the elements in it, and facts
// about the page, the window and the browser. The server's headless browser opens the page the same
// way to take the screenshots (page_screenshots.ts); the selection is cut from them here.
import { browser_name, type ClientHints } from './browser_name';
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

// Taller pages get the slice around the screen: past this the image is too thin to read
const MAX_FULL_PAGE_HEIGHT = 16_384;
// PNG keeps text sharp; a photo-heavy selection is smaller as WebP or JPEG
const MAX_PNG_BYTES = 1.5 * 1024 * 1024;

type Point = { x: number; y: number };

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

/** A selector that finds this element again in a fresh copy of the page */
export function element_path(element: Element): string {
	const steps: string[] = [];
	let current: Element | null = element;
	while (current && current !== document.documentElement) {
		if (current.id) {
			steps.unshift(`#${CSS.escape(current.id)}`);
			break;
		}
		const name = current.localName;
		const siblings: Element[] = current.parentElement
			? [...current.parentElement.children].filter((sibling) => sibling.localName === name)
			: [];
		steps.unshift(
			siblings.length > 1 ? `${name}:nth-of-type(${siblings.indexOf(current) + 1})` : name
		);
		current = current.parentElement;
	}
	return steps.join(' > ');
}

function is_pinned(element: Element): boolean {
	for (let current: Element | null = element; current; current = current.parentElement) {
		const { position } = getComputedStyle(current);
		if (position === 'fixed' || position === 'sticky') return true;
	}
	return false;
}

// The innermost ordinary element whose box holds the point: not SVG drawing (Safari puts the
// header logo's oversized outline on top of the page), not the page itself, not a pinned bar
function anchor_at(rect: ViewportRect): IssueReportPage['anchor'] {
	const x = rect.x + rect.width / 2;
	const y = rect.y + rect.height / 2;
	const element = document.elementsFromPoint(x, y).find((candidate) => {
		if (!(candidate instanceof HTMLElement) || candidate === document.body) return false;
		const box = candidate.getBoundingClientRect();
		const holds_point = box.left <= x && x <= box.right && box.top <= y && y <= box.bottom;
		return holds_point && !is_pinned(candidate);
	});
	if (!element) return null;
	const box = element.getBoundingClientRect();
	return {
		path: clip(element_path(element), 1000),
		text: clip((element.textContent ?? '').replace(/\s+/g, ' ').trim(), 100),
		x: box.x,
		y: box.y
	};
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
		anchor: anchor_at(selection ?? { x: 0, y: 0, ...viewport }),
		elements: elements_in_rect(selection ?? { x: 0, y: 0, ...viewport }),
		errors
	};
}

// --- Screenshots: the server's headless browser takes them (page_screenshots.ts) ---

function screenshot_blob({ media_type, base64 }: Screenshot): Blob {
	const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
	return new Blob([bytes], { type: media_type });
}

/** An address to show a screenshot at in this page. Revoke it with URL.revokeObjectURL. */
export function screenshot_url(screenshot: Screenshot): string {
	return URL.createObjectURL(screenshot_blob(screenshot));
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

function blob_to_base64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const data_url = String(reader.result);
			resolve(data_url.slice(data_url.indexOf(',') + 1));
		};
		reader.onerror = () => reject(reader.error ?? new Error('Could not read the screenshot'));
		reader.readAsDataURL(blob);
	});
}

/** The smallest file under the size limit: PNG keeps text sharp, then WebP or JPEG, then smaller */
async function encode_screenshot(canvas: HTMLCanvasElement): Promise<Screenshot> {
	const attempts: [ScreenshotMediaType, number | undefined, number][] = [
		['image/png', undefined, MAX_PNG_BYTES],
		['image/webp', 0.9, MAX_SCREENSHOT_BYTES],
		['image/jpeg', 0.85, MAX_SCREENSHOT_BYTES]
	];
	let source = canvas;
	for (let shrink = 0; shrink < 4; shrink++) {
		for (const [media_type, quality, max_bytes] of attempts) {
			const blob = await canvas_blob(source, media_type, quality);
			// A browser that can't write the type hands back a PNG instead
			if (blob && blob.type === media_type && blob.size <= max_bytes) {
				return { media_type, base64: await blob_to_base64(blob) };
			}
		}
		source = scaled_down(source, 0.7);
	}
	throw new Error('The selection is too big to send, even scaled down');
}

/**
 * The selected part of the screen screenshot. It has the screen's pixel density, so the selection's
 * CSS pixels are scaled to it. Null when the whole screen was reported.
 */
export async function cut_selection(
	screen: Screenshot,
	page: IssueReportPage
): Promise<Screenshot | null> {
	if (!page.selection) return null;
	const image = await createImageBitmap(screenshot_blob(screen));
	const scale = image.width / page.window.viewport.width;
	const x = Math.max(0, Math.round(page.selection.x * scale));
	const y = Math.max(0, Math.round(page.selection.y * scale));
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.min(image.width - x, Math.round(page.selection.width * scale)));
	canvas.height = Math.max(
		1,
		Math.min(image.height - y, Math.round(page.selection.height * scale))
	);
	canvas
		.getContext('2d')
		?.drawImage(image, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
	image.close();
	return encode_screenshot(canvas);
}
