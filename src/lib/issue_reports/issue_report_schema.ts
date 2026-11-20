// What the Report button in the admin menu sends: the admin's request, a screenshot of the area they
// selected, and facts about the page. Shared by the browser (IssueReporter.svelte) and the server
// (server/issue_reports), which triages it into a GitHub issue.
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

export const issue_report_schema = v.object({
	request: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(5000)),
	screenshot: v.nullable(
		v.object({
			media_type: v.picklist(SCREENSHOT_MEDIA_TYPES),
			base64: v.pipe(
				v.string(),
				v.maxLength(MAX_SCREENSHOT_BASE64_LENGTH),
				v.regex(/^[A-Za-z0-9+/]+=*$/)
			)
		})
	),
	page: v.object({
		url: v.pipe(v.string(), v.url()),
		route_id: v.nullable(v.string()),
		title: v.pipe(v.string(), v.maxLength(300)),
		captured_at: v.pipe(v.string(), v.isoTimestamp()),
		viewport: v.object({
			width: v.number(),
			height: v.number(),
			device_pixel_ratio: v.number()
		}),
		scroll: v.object({ x: v.number(), y: v.number() }),
		// In viewport pixels. Null: the whole viewport.
		selection: v.nullable(rect_schema),
		browser: v.object({
			user_agent: v.pipe(v.string(), v.maxLength(500)),
			// From User-Agent Client Hints (Chromium only), e.g. "Google Chrome 142"
			brand: v.nullable(v.pipe(v.string(), v.maxLength(100))),
			platform: v.nullable(v.pipe(v.string(), v.maxLength(100))),
			is_mobile: v.nullable(v.boolean()),
			language: v.pipe(v.string(), v.maxLength(50)),
			time_zone: v.pipe(v.string(), v.maxLength(100))
		}),
		color_scheme: v.picklist(['light', 'dark']),
		// The site theme's class on <html>, e.g. "theme-system"
		theme: v.nullable(v.pipe(v.string(), v.maxLength(100))),
		reduced_motion: v.boolean(),
		elements: v.pipe(v.array(element_schema), v.maxLength(20)),
		errors: v.pipe(v.array(page_error_schema), v.maxLength(10))
	})
});

export type IssueReport = v.InferOutput<typeof issue_report_schema>;
export type IssueReportPage = IssueReport['page'];
export type ViewportRect = v.InferOutput<typeof rect_schema>;
export type PageElement = v.InferOutput<typeof element_schema>;
export type PageError = v.InferOutput<typeof page_error_schema>;

// What filing a report gives back
export interface FiledIssue {
	number: number;
	url: string;
	title: string;
}
