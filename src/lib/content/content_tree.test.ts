import { describe, expect, it } from 'vitest';
import { is_site_path, safe_fragment_id, safe_href } from './content_tree';

describe('safe_href', () => {
	it.each([
		'https://syntax.fm/show/900',
		'http://example.com',
		'mailto:hello@syntax.fm',
		'#t=12:34',
		'/pages/privacy',
		'getfresh.dev',
		'//example.com/path'
	])('keeps %s', (href) => {
		expect(safe_href(href)).toBe(href);
	});

	it.each([
		'javascript:alert(1)',
		'JaVaScRiPt:alert(1)',
		'java\tscript:alert(1)',
		'\u0001 javascript:alert(1)',
		' javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:msgbox(1)',
		'svelte:head',
		'',
		'   ',
		'file:///etc/passwd'
	])('rejects %j', (href) => {
		expect(safe_href(href)).toBeUndefined();
	});

	it('rejects non-strings', () => {
		expect(safe_href(undefined)).toBeUndefined();
		expect(safe_href(['https://syntax.fm'])).toBeUndefined();
	});
});

describe('safe_fragment_id', () => {
	it('keeps slug ids, including non-ASCII letters', () => {
		expect(safe_fragment_id('show-notes')).toBe('show-notes');
		expect(safe_fragment_id('café_2')).toBe('café_2');
	});

	it('rejects ids that could carry markup or extra attributes', () => {
		expect(safe_fragment_id('x" onmouseover="alert(1)')).toBeUndefined();
		expect(safe_fragment_id('a b')).toBeUndefined();
		expect(safe_fragment_id('')).toBeUndefined();
		expect(safe_fragment_id(42)).toBeUndefined();
	});
});

describe('is_site_path', () => {
	it('accepts root-relative paths on this site', () => {
		expect(is_site_path('/')).toBe(true);
		expect(is_site_path('/show/879/fullstack-cloudflare?x=1#t=1')).toBe(true);
	});

	it('rejects paths that leave the site or are not root-relative', () => {
		expect(is_site_path('//evil.example/x')).toBe(false);
		expect(is_site_path('/\\evil.example/x')).toBe(false);
		expect(is_site_path('https://syntax.fm/x')).toBe(false);
		expect(is_site_path('javascript:alert(1)')).toBe(false);
		expect(is_site_path('show/1')).toBe(false);
	});
});
