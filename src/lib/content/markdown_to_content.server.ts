import { processor } from '$utilities/markdown';
import {
	SITE_ORIGIN,
	is_heading_tag,
	is_plain_tag,
	is_site_path,
	safe_fragment_id,
	safe_href,
	type CellAlign,
	type ContentNode,
	type ContentTree,
	type LinkTarget
} from './content_tree';

// The hast types come from the processor itself, so they always match the installed rehype stack.
type HastRoot = ReturnType<typeof processor.runSync>;
type HastNode = HastRoot['children'][number];
type HastElement = Extract<HastNode, { type: 'element' }>;
type HastChild = HastElement['children'][number];
type HastProperties = HastElement['properties'];

/** Elements nested deeper than this are reduced to their text. Real show notes stay far below it. */
export const MAX_CONTENT_DEPTH = 32;

// Elements whose content is not prose: dropped together with everything inside them.
const DROPPED_TAGS: ReadonlySet<string> = new Set([
	'applet',
	'area',
	'audio',
	'base',
	'button',
	'canvas',
	'dialog',
	'embed',
	'form',
	'frame',
	'frameset',
	'head',
	'iframe',
	'img',
	'input',
	'link',
	'map',
	'math',
	'meta',
	'noembed',
	'noframes',
	'noscript',
	'object',
	'optgroup',
	'option',
	'param',
	'picture',
	'plaintext',
	'portal',
	'script',
	'select',
	'slot',
	'source',
	'style',
	'svg',
	'template',
	'textarea',
	'title',
	'track',
	'video',
	'xmp'
]);

// highlight.js output (`hljs`, `language-js`, `hljs-keyword`, `function_`) and the permalink icon.
const CODE_CLASS = /^(hljs|language-[\w+#-]+)$/;
const SPAN_CLASS = /^(hljs-[\w-]+|[a-z]+_+|icon|icon-link)$/;

/** Renders Markdown with the site pipeline and returns the safe tree for `MarkdownContent`. */
export function markdown_to_content(markdown: string): ContentTree {
	const root = processor.runSync(processor.parse(markdown));
	return convert_children(root.children, 0);
}

function convert_children(
	nodes: ReadonlyArray<HastNode | HastChild>,
	depth: number
): ContentNode[] {
	return nodes.flatMap((node) => convert_node(node, depth));
}

function convert_node(node: HastNode | HastChild, depth: number): ContentNode[] {
	if (node.type === 'text') return [{ kind: 'text', value: node.value }];
	// Comments, doctypes and any leftover raw HTML never reach the page.
	if (node.type !== 'element') return [];
	return convert_element(node, depth);
}

function convert_element(element: HastElement, depth: number): ContentNode[] {
	const tag = element.tagName.toLowerCase();
	if (DROPPED_TAGS.has(tag)) return [];
	if (depth >= MAX_CONTENT_DEPTH) {
		const value = text_content(element);
		return value ? [{ kind: 'text', value }] : [];
	}

	const { properties } = element;
	if (tag === 'br') return [{ kind: 'line_break' }];
	if (tag === 'hr') return [{ kind: 'thematic_break' }];

	const children = convert_children(element.children, depth + 1);

	if (is_plain_tag(tag)) return [{ kind: 'plain', tag, children }];
	if (is_heading_tag(tag)) {
		return [{ kind: 'heading', tag, id: safe_fragment_id(properties.id), children }];
	}

	switch (tag) {
		case 'a': {
			const target = link_target(properties.href);
			if (target === undefined) {
				const id = safe_fragment_id(properties.name);
				// A link with no safe target is just its text (or a legacy named jump target).
				return id === undefined ? children : [{ kind: 'anchor', id, children }];
			}
			return [
				{
					kind: 'link',
					target,
					aria_hidden: is_true(properties.ariaHidden) ? true : undefined,
					tab_index: properties.tabIndex === -1 ? -1 : undefined,
					children
				}
			];
		}
		case 'ol':
			return [{ kind: 'ordered_list', start: bounded_int(properties.start, 0), children }];
		case 'code':
		case 'span':
			return [
				{
					kind: 'styled_inline',
					tag,
					class_name: class_name(properties, tag === 'code' ? CODE_CLASS : SPAN_CLASS),
					children
				}
			];
		case 'td':
		case 'th':
			return [
				{
					kind: 'cell',
					tag,
					row_span: bounded_int(properties.rowSpan, 1),
					col_span: bounded_int(properties.colSpan, 1),
					align: cell_align(properties.align),
					children
				}
			];
		default:
			// Unknown or presentational wrappers (`<main>`, `<commit>` typed in prose): keep the text.
			return children;
	}
}

function link_target(value: unknown): LinkTarget | undefined {
	const href = safe_href(value);
	if (href === undefined) return undefined;
	if (href.startsWith('#')) return { type: 'fragment', fragment: href.slice(1) };
	if (is_site_path(href)) return { type: 'site_path', path: href };

	// Absolute links to the site (`https://syntax.fm/show/879/...`) navigate in-app, as they do in
	// production. Other relative links (`getfresh.dev`) stay as written.
	const url = new URL(href, SITE_ORIGIN);
	const path = `${url.pathname}${url.search}${url.hash}`;
	if (/^[a-z][a-z\d+.-]*:/i.test(href) && url.origin === SITE_ORIGIN && is_site_path(path)) {
		return { type: 'site_path', path };
	}
	return { type: 'external', url: href };
}

function text_content(element: HastElement): string {
	let text = '';
	const stack: HastChild[] = [...element.children].reverse();
	while (stack.length) {
		const node = stack.pop();
		if (!node) break;
		if (node.type === 'text') text += node.value;
		else if (node.type === 'element' && !DROPPED_TAGS.has(node.tagName.toLowerCase())) {
			for (let index = node.children.length - 1; index >= 0; index--) {
				stack.push(node.children[index]);
			}
		}
	}
	return text;
}

function class_name(properties: HastProperties, allowed: RegExp): string | undefined {
	const raw = properties.className;
	const tokens = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\s+/) : [];
	const kept = tokens.filter(
		(token): token is string => typeof token === 'string' && allowed.test(token)
	);
	return kept.length ? kept.join(' ') : undefined;
}

function bounded_int(value: unknown, min: number): number | undefined {
	const number = typeof value === 'string' ? Number(value) : value;
	return typeof number === 'number' && Number.isInteger(number) && number >= min && number <= 10_000
		? number
		: undefined;
}

function cell_align(value: unknown): CellAlign | undefined {
	return value === 'left' || value === 'center' || value === 'right' ? value : undefined;
}

function is_true(value: unknown): boolean {
	return value === true || value === 'true';
}
