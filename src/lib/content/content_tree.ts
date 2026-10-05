// A bounded, typed tree for rendered Markdown (show notes, site pages). The server converts its
// Markdown pipeline output into this shape and `MarkdownContent.svelte` renders it with native
// Svelte elements, so no route ships a raw HTML string to `{@html}`.
//
// Only the node kinds below exist. Anything else in the source (scripts, styles, iframes, event
// attributes, unknown tags) is dropped or reduced to its text during conversion.

export const PLAIN_TAGS = [
	'p',
	'blockquote',
	'pre',
	'ul',
	'li',
	'strong',
	'em',
	'b',
	'i',
	'del',
	's',
	'sup',
	'sub',
	'table',
	'thead',
	'tbody',
	'tfoot',
	'tr'
] as const;
export type PlainTag = (typeof PLAIN_TAGS)[number];

export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
export type HeadingTag = (typeof HEADING_TAGS)[number];

export type CellAlign = 'left' | 'center' | 'right';

export type ContentNode =
	| { kind: 'text'; value: string }
	| { kind: 'plain'; tag: PlainTag; children: ContentNode[] }
	| { kind: 'heading'; tag: HeadingTag; id?: string; children: ContentNode[] }
	// `aria_hidden`/`tab_index` carry the heading permalink anchors added by rehype-autolink-headings.
	| {
			kind: 'link';
			target: LinkTarget;
			aria_hidden?: true;
			tab_index?: -1;
			children: ContentNode[];
	  }
	// A legacy `<a name="...">` jump target, rendered as an element with that id.
	| { kind: 'anchor'; id: string; children: ContentNode[] }
	| { kind: 'ordered_list'; start?: number; children: ContentNode[] }
	// Syntax-highlighted code (`hljs` classes) and the heading permalink icon span.
	| { kind: 'styled_inline'; tag: 'code' | 'span'; class_name?: string; children: ContentNode[] }
	| {
			kind: 'cell';
			tag: 'td' | 'th';
			row_span?: number;
			col_span?: number;
			align?: CellAlign;
			children: ContentNode[];
	  }
	| { kind: 'line_break' }
	| { kind: 'thematic_break' };

export type ContentTree = ContentNode[];

/**
 * Where a link goes. Site paths render through SvelteKit's `resolve()` so they keep client-side
 * navigation (and the playing episode); everything else is marked `rel="external"`.
 */
export type LinkTarget =
	| { type: 'fragment'; fragment: string }
	| { type: 'site_path'; path: SitePath }
	| { type: 'external'; url: string };

export type SitePath = `/${string}`;

/** The site's canonical origin: absolute links to it are site paths, as they are in production. */
export const SITE_ORIGIN = 'https://syntax.fm';

const PLAIN_TAG_SET: ReadonlySet<string> = new Set(PLAIN_TAGS);
const HEADING_TAG_SET: ReadonlySet<string> = new Set(HEADING_TAGS);

export function is_plain_tag(tag: string): tag is PlainTag {
	return PLAIN_TAG_SET.has(tag);
}

export function is_heading_tag(tag: string): tag is HeadingTag {
	return HEADING_TAG_SET.has(tag);
}

/** A root-relative path on this site (not `//host` or `/\host`, which leave the origin). */
export function is_site_path(value: unknown): value is SitePath {
	if (typeof value !== 'string' || !value.startsWith('/')) return false;
	try {
		return new URL(value, SITE_ORIGIN).origin === SITE_ORIGIN;
	} catch {
		return false;
	}
}

const SAFE_LINK_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:']);

/**
 * Returns the href when it is an http(s) or mailto URL, or a non-empty relative/fragment link;
 * otherwise undefined. Uses the WHATWG URL parser, the same one browsers use, so tricks like
 * `java\tscript:` or leading control characters resolve to the protocol a browser would follow.
 */
export function safe_href(value: unknown): string | undefined {
	// An empty href only points back at the current page.
	if (typeof value !== 'string' || value.trim() === '') return undefined;
	try {
		const { protocol } = new URL(value, SITE_ORIGIN);
		return SAFE_LINK_PROTOCOLS.has(protocol) ? value : undefined;
	} catch {
		return undefined;
	}
}

/** Heading ids and `<a name>` anchor ids: letters, numbers, `_` and `-` only. */
export function safe_fragment_id(value: unknown): string | undefined {
	return typeof value === 'string' && /^[\p{L}\p{N}_-]{1,200}$/u.test(value) ? value : undefined;
}
