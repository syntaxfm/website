import { describe, expect, it } from 'vitest';
import { sitemap_xml } from './sitemap';

describe('sitemap_xml', () => {
	it('uses the standard sitemap namespace', () => {
		const xml = sitemap_xml('https://syntax.fm', []);

		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	it('writes each url, with lastmod when known', () => {
		const xml = sitemap_xml('https://syntax.fm', [
			{ path: '' },
			{ path: '/show/900/css', lastmod: '2025-06-01T09:00:00.000Z' }
		]);

		expect(xml).toContain('<url><loc>https://syntax.fm</loc></url>');
		expect(xml).toContain(
			'<url><loc>https://syntax.fm/show/900/css</loc><lastmod>2025-06-01T09:00:00.000Z</lastmod></url>'
		);
	});

	it('escapes characters XML does not allow in a url', () => {
		const xml = sitemap_xml('https://syntax.fm', [{ path: "/tags/r&d's" }]);

		expect(xml).toContain('<loc>https://syntax.fm/tags/r&amp;d&apos;s</loc>');
	});
});
