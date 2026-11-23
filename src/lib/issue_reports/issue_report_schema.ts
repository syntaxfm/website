// What the admin menu's Report button sends: the admin's request, screenshots of the area they
// selected, the screen and the full page, and facts about the page, window and browser. Shared by
// the browser (IssueReporter.svelte) and the server (server/issue_reports), which takes the
// screenshots in a headless browser and triages the report into a GitHub issue.
import * as v from 'valibot';

export const SCREENSHOT_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type ScreenshotMediaType = (typeof SCREENSHOT_MEDIA_TYPES)[number];

// Claude takes images up to 5 MB, and base64 is 4/3 the size of the bytes
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MAX_SCREENSHOT_BASE64_LENGTH = Math.ceil((MAX_SCREENSHOT_BYTES * 4) / 3);

const rect_schema = v.object({
	x: v.number(),
	y: v.number(),
	width: v.number(),
	height: v.number()
});

// An element in the selected area. The `area` is the smallest element holding all of them.
const element_schema = v.object({
	kind: v.picklist(['area', 'element']),
	selector: v.pipe(v.string(), v.maxLength(300)),
	text: v.pipe(v.string(), v.maxLength(200)),
	// file:line:column of the Svelte markup that made it. Only `pnpm dev` knows it.
	source: v.nullable(v.pipe(v.string(), v.maxLength(300)))
});

// A script error the page threw before the report
const page_error_schema = v.object({
	message: v.pipe(v.string(), v.maxLength(500)),
	source: v.nullable(v.pipe(v.string(), v.maxLength(300))),
	at: v.pipe(v.string(), v.isoTimestamp())
});

const screenshot_schema = v.object({
	media_type: v.picklist(SCREENSHOT_MEDIA_TYPES),
	base64: v.pipe(
		v.string(),
		v.maxLength(MAX_SCREENSHOT_BASE64_LENGTH),
		v.regex(/^[A-Za-z0-9+/]+=*$/)
	)
});

const size_schema = v.object({ width: v.number(), height: v.number() });

// A window the headless browser can open at: phone to big desktop
const window_size = (max: number) => v.pipe(v.number(), v.minValue(100), v.maxValue(max));

// Facts about the page, the window and the browser, as the admin had them. The headless browser
// that takes the screenshots opens the page the same way (server/issue_reports/page_screenshots.ts).
// They end up in a public GitHub issue, so nothing that locates or fingerprints the admin: no time
// zone, language, or screen and browser window sizes.
export const issue_report_page_schema = v.object({
	url: v.pipe(v.string(), v.url()),
	route_id: v.nullable(v.string()),
	title: v.pipe(v.string(), v.maxLength(300)),
	captured_at: v.pipe(v.string(), v.isoTimestamp()),
	// All CSS pixels
	window: v.object({
		viewport: v.object({ width: window_size(4000), height: window_size(4000) }),
		// What's on screen when pinch-zoomed (phones); null where the browser doesn't say
		visual_viewport: v.nullable(v.object({ ...size_schema.entries, scale: v.number() })),
		// The whole page's scrollable size
		document: size_schema,
		device_pixel_ratio: v.pipe(v.number(), v.minValue(0.5), v.maxValue(5))
	}),
	scroll: v.object({ x: v.pipe(v.number(), v.minValue(0)), y: v.pipe(v.number(), v.minValue(0)) }),
	// The rows the full-page screenshot covers: all of them, or on a very long page the slice
	// around the screen
	full_page: v.object({ top: v.number(), height: v.number() }),
	// In viewport pixels. Null: the whole viewport.
	selection: v.nullable(rect_schema),
	// The element under the middle of the selection, and where it was on screen. The headless
	// browser scrolls its page to put the same element in the same place, since another browser
	// can lay the page out a little differently. Null when it's pinned (fixed or sticky).
	anchor: v.nullable(
		v.object({
			path: v.pipe(v.string(), v.maxLength(1000)),
			text: v.pipe(v.string(), v.maxLength(100)),
			x: v.number(),
			y: v.number()
		})
	),
	browser: v.object({
		// e.g. "Safari 18.2 on iOS 18.2" (browser_name.ts)
		name: v.pipe(v.string(), v.maxLength(150)),
		// Only for the headless browser to open the page as this browser. Never in the issue or the
		// triage (server/issue_reports/public_page_facts.ts).
		user_agent: v.pipe(v.string(), v.maxLength(500)),
		is_mobile: v.boolean(),
		is_touch: v.boolean()
	}),
	color_scheme: v.picklist(['light', 'dark']),
	// The site theme's class on <html>, e.g. "theme-system"
	theme: v.nullable(v.pipe(v.string(), v.maxLength(100))),
	reduced_motion: v.boolean(),
	elements: v.pipe(v.array(element_schema), v.maxLength(20)),
	errors: v.pipe(v.array(page_error_schema), v.maxLength(10))
});

// A shot of the page the headless browser keeps open for a report: null, or once it has closed, it
// opens the page again
export const page_shot_schema = v.object({
	kept_page: v.nullable(v.pipe(v.string(), v.maxLength(100))),
	page: issue_report_page_schema
});

export const issue_report_schema = v.object({
	request: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(5000)),
	// Each is null when the headless browser couldn't take it
	screenshots: v.object({
		// The dragged area, cut from the screen. Null for a click, which reports the whole screen.
		selection: v.nullable(screenshot_schema),
		// The visible screen (the viewport)
		screen: v.nullable(screenshot_schema),
		// The whole page, top to bottom, with the screen and the selection outlined
		page: v.nullable(screenshot_schema)
	}),
	page: issue_report_page_schema
});

export type IssueReport = v.InferOutput<typeof issue_report_schema>;
export type IssueReportPage = v.InferOutput<typeof issue_report_page_schema>;
export type Screenshot = v.InferOutput<typeof screenshot_schema>;
export type ScreenshotKind = keyof IssueReport['screenshots'];
export type ViewportRect = v.InferOutput<typeof rect_schema>;
export type PageElement = v.InferOutput<typeof element_schema>;
export type PageError = v.InferOutput<typeof page_error_schema>;

// What filing a report gives back
export interface FiledIssue {
	number: number;
	url: string;
	title: string;
}
