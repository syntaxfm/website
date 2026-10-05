import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';
import { render } from 'svelte/server';
import { processor } from '$utilities/markdown';
import MarkdownContent from './MarkdownContent.svelte';
import type { ContentTree } from './content_tree';
import { markdown_to_content } from './markdown_to_content.server';
import privacy from '../../routes/(site)/pages/privacy.md?raw';
import terms from '../../routes/(site)/pages/terms-of-service.md?raw';
import standards_show from '../../../shows/1012 - Web Standards with Jake Archibald.md?raw';
import es2022_show from '../../../shows/388 - ES2022.md?raw';
import container_queries_show from '../../../shows/345 - container queries.md?raw';

function render_content(content: ContentTree): string {
	return render(MarkdownContent, { props: { content } }).body;
}

// Serialization-only differences between rehype-stringify and Svelte SSR: Svelte's hydration
// comments, attribute order, `&#x26;` vs `&amp;` style entities and `<br>` vs `<br/>`.
function normalize(html: string): string {
	return html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replaceAll('&#x26;', '&amp;')
		.replaceAll('&#x3C;', '&lt;')
		.replaceAll('&#x22;', '&quot;')
		.replace(/<(br|hr)\/>/g, '<$1>')
		.replace(
			/<([a-z0-9]+)((?:\s+[a-z-]+(?:="[^"]*")?)+)\s*>/g,
			(_match, tag: string, attributes: string) =>
				`<${tag} ${(attributes.match(/[a-z-]+(?:="[^"]*")?/g) ?? []).sort().join(' ')}>`
		);
}

// The two intended link changes: `https://syntax.fm/...` links become site paths (in-app navigation)
// and links to other origins carry `rel="external"`.
function legacy_html(markdown: string): string {
	return normalize(
		String(processor.processSync(markdown)).replaceAll('href="https://syntax.fm/', 'href="/')
	);
}

function rendered_html(markdown: string): string {
	return normalize(render_content(markdown_to_content(markdown)).replaceAll(' rel="external"', ''));
}

describe('MarkdownContent', () => {
	it.each([
		['show 1012 (timestamps, links)', standards_show],
		['show 388 (highlighted code)', es2022_show],
		['show 345 (code, nested lists)', container_queries_show]
	])('renders %s exactly like the previous HTML pipeline', (_name, file) => {
		const { content: markdown } = matter(file);

		expect(rendered_html(markdown)).toBe(legacy_html(markdown));
	});

	it('renders the terms page exactly like the previous HTML pipeline', () => {
		expect(rendered_html(terms)).toBe(legacy_html(terms));
	});

	it('renders the privacy page like before, minus its inline <style> block and table classes', () => {
		const expected = legacy_html(privacy)
			// Its `<a name>` jump targets become ids, the same fragment targets without obsolete markup.
			.replace(/<a name="([^"]+)"><\/a>/g, '<span id="$1"></span>')
			.replace(/<style>[\s\S]*?<\/style>/, '')
			.replaceAll(' class="personal-information-categories"', '')
			.replaceAll(' class="odd"', '');

		expect(rendered_html(privacy)).toBe(expected);
	});

	it('marks other-origin links external and resolves site paths', () => {
		const html = render_content(
			markdown_to_content(
				'[a](https://sentry.io/syntax) [b](https://syntax.fm/show/1) [c](#t=1:00)'
			)
		);

		expect(html).toContain('<a href="https://sentry.io/syntax" rel="external">');
		expect(html).toContain('<a href="/show/1">');
		expect(html).toContain('<a href="#t=1:00">');
	});

	it('does not render disallowed tags or URLs even when handed an unchecked tree', () => {
		// Simulates a tree that did not come from markdown_to_content.
		const unchecked: ContentTree = JSON.parse(
			JSON.stringify([
				{ kind: 'plain', tag: 'script', children: [{ kind: 'text', value: 'alert(1)' }] },
				{ kind: 'heading', tag: 'iframe', children: [] },
				{ kind: 'heading', tag: 'h2', id: 'x" onclick="alert(1)', children: [] },
				{
					kind: 'link',
					target: { type: 'external', url: 'javascript:alert(1)' },
					children: [{ kind: 'text', value: 'x' }]
				},
				{
					kind: 'link',
					target: { type: 'site_path', path: 'javascript:alert(2)' },
					children: [{ kind: 'text', value: 'y' }]
				},
				{ kind: 'text', value: '<img src=x onerror=alert(1)>' }
			])
		);

		const html = render_content(unchecked).replace(/<!--[\s\S]*?-->/g, '');

		expect(html).not.toMatch(/<script|<iframe|<img|onclick=|javascript:/);
		// Unsafe links fall back to their text; text stays text.
		expect(html).toBe('<h2></h2>xy&lt;img src=x onerror=alert(1)>');
	});
});
