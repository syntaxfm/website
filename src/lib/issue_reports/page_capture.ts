// What the Report button captures in the browser: a screenshot of the selected area (through the
// browser's own tab capture, so it's exactly what the admin sees), the elements in it, and facts
// about the page and the browser.
import {
	MAX_SCREENSHOT_BYTES,
	type IssueReportPage,
	type PageElement,
	type PageError,
	type ScreenshotMediaType,
	type ViewportRect
} from './issue_report_schema';

// Anything smaller is a click, which reports the whole viewport
const MIN_SELECTION_SIZE = 8;
// Bigger screenshots are scaled down; Claude scales anything over ~1600px down anyway
const MAX_SCREENSHOT_SIDE = 2560;
// PNG keeps text sharp; photo-heavy areas are smaller as WebP or JPEG
const MAX_PNG_BYTES = 1.5 * 1024 * 1024;
const MAX_ELEMENTS = 12;
// Points sampled per side of the selection, to find the elements in it
const MAX_SAMPLES_PER_SIDE = 6;
const SAMPLE_SPACING = 80;
// Svelte's scoped-style classes (svelte-1a2b3c) say nothing about the element
const SVELTE_SCOPE_CLASS = /^svelte-[a-z0-9]+$/;

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
interface UserAgentData {
	brands: { brand: string; version: string }[];
	mobile: boolean;
	platform: string;
}

function user_agent_data(): UserAgentData | null {
	const data: unknown = Reflect.get(navigator, 'userAgentData');
	if (typeof data !== 'object' || data === null) return null;
	if (!('brands' in data) || !Array.isArray(data.brands)) return null;
	const brands = data.brands.filter(
		(entry): entry is UserAgentData['brands'][number] =>
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

// "Google Chrome 142" rather than "Chromium" or the made-up "Not_A Brand"
function primary_brand(brands: UserAgentData['brands']): string | null {
	const real = brands.filter(({ brand }) => !/not.a.brand/i.test(brand));
	const named = real.find(({ brand }) => brand !== 'Chromium') ?? real[0];
	return named ? `${named.brand} ${named.version}` : null;
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
	const viewport = { width: innerWidth, height: innerHeight, device_pixel_ratio: devicePixelRatio };
	const agent = user_agent_data();
	return {
		url: location.href,
		route_id,
		title: clip(document.title, 300),
		captured_at: new Date().toISOString(),
		viewport,
		scroll: { x: Math.round(scrollX), y: Math.round(scrollY) },
		selection,
		browser: {
			user_agent: clip(navigator.userAgent, 500),
			brand: agent ? primary_brand(agent.brands) : null,
			platform: agent?.platform || null,
			is_mobile: agent ? agent.mobile : null,
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

// --- Screenshot ---

export interface TabCapture {
	stream: MediaStream;
	video: HTMLVideoElement;
}

// Chromium's options for offering this tab first; other browsers ignore them
type TabCaptureOptions = DisplayMediaStreamOptions & {
	preferCurrentTab?: boolean;
	selfBrowserSurface?: 'include' | 'exclude';
	surfaceSwitching?: 'include' | 'exclude';
};

/** Asks to capture this tab. Null when the browser can't, or the admin says no. */
export async function start_tab_capture(): Promise<TabCapture | null> {
	if (!navigator.mediaDevices?.getDisplayMedia) return null;
	const options: TabCaptureOptions = {
		video: { displaySurface: 'browser' },
		audio: false,
		preferCurrentTab: true,
		selfBrowserSurface: 'include',
		surfaceSwitching: 'exclude'
	};
	try {
		const stream = await navigator.mediaDevices.getDisplayMedia(options);
		const video = document.createElement('video');
		video.muted = true;
		video.playsInline = true;
		video.srcObject = stream;
		await video.play();
		return { stream, video };
	} catch (capture_error) {
		console.error('The browser didn’t start a tab capture', capture_error);
		return null;
	}
}

export function stop_tab_capture({ stream, video }: TabCapture): void {
	for (const track of stream.getTracks()) track.stop();
	video.srcObject = null;
}

function next_animation_frame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export interface CapturedFrame {
	canvas: HTMLCanvasElement;
	// The capture shows a tab (this one), so viewport positions map onto it
	is_tab: boolean;
}

/**
 * The tab as it looks now. Call it once the selection overlay is gone: it waits for the page to
 * repaint and for the capture to catch up.
 */
export async function grab_frame({ stream, video }: TabCapture): Promise<CapturedFrame | null> {
	const [track] = stream.getVideoTracks();
	if (!track || track.readyState === 'ended') return null;
	await next_animation_frame();
	await next_animation_frame();
	await new Promise((resolve) => setTimeout(resolve, 200));
	if (video.videoWidth === 0 || video.videoHeight === 0) return null;

	const canvas = document.createElement('canvas');
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext('2d')?.drawImage(video, 0, 0);
	return { canvas, is_tab: track.getSettings().displaySurface === 'browser' };
}

/**
 * Where the viewport sits in a captured frame. Usually all of it, but Chrome letterboxes the tab
 * when it changes size during the capture (the "sharing this tab" bar shrinks it).
 */
export function viewport_in_frame(
	frame: { width: number; height: number },
	viewport: { width: number; height: number }
): { x: number; y: number; scale: number } {
	const scale = Math.min(frame.width / viewport.width, frame.height / viewport.height);
	return {
		x: (frame.width - viewport.width * scale) / 2,
		y: (frame.height - viewport.height * scale) / 2,
		scale
	};
}

/** The selected part of the frame (all of it when there's no selection or it isn't this tab) */
export function crop_frame(
	frame: CapturedFrame,
	selection: ViewportRect | null,
	viewport: { width: number; height: number }
): HTMLCanvasElement {
	let source = { x: 0, y: 0, width: frame.canvas.width, height: frame.canvas.height };
	if (selection && frame.is_tab) {
		const placement = viewport_in_frame(frame.canvas, viewport);
		source = {
			x: placement.x + selection.x * placement.scale,
			y: placement.y + selection.y * placement.scale,
			width: selection.width * placement.scale,
			height: selection.height * placement.scale
		};
	}
	const scale = Math.min(1, MAX_SCREENSHOT_SIDE / Math.max(source.width, source.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(source.width * scale));
	canvas.height = Math.max(1, Math.round(source.height * scale));
	canvas
		.getContext('2d')
		?.drawImage(
			frame.canvas,
			source.x,
			source.y,
			source.width,
			source.height,
			0,
			0,
			canvas.width,
			canvas.height
		);
	return canvas;
}

function canvas_blob(canvas: HTMLCanvasElement, type: string, quality?: number) {
	return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function encode_screenshot(
	canvas: HTMLCanvasElement
): Promise<{ blob: Blob; media_type: ScreenshotMediaType }> {
	const attempts: [ScreenshotMediaType, number | undefined, number][] = [
		['image/png', undefined, MAX_PNG_BYTES],
		['image/webp', 0.92, MAX_SCREENSHOT_BYTES],
		['image/jpeg', 0.85, MAX_SCREENSHOT_BYTES]
	];
	for (const [media_type, quality, max_bytes] of attempts) {
		const blob = await canvas_blob(canvas, media_type, quality);
		// A browser that can't write the type hands back a PNG instead
		if (blob && blob.type === media_type && blob.size <= max_bytes) return { blob, media_type };
	}
	throw new Error('The screenshot is too big to send, even as a JPEG');
}

export function blob_to_base64(blob: Blob): Promise<string> {
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
