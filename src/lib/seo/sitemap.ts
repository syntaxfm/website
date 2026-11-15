// sitemap.xml: every public page, with when it last changed. Search engines ignore changefreq and
// priority, so only loc and lastmod are written.

export type SitemapUrl = {
	path: string;
	// Edge-cached rows have been through JSON, so dates can arrive as ISO strings
	lastmod?: Date | string | null;
};

const XML_ENTITIES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;'
};

function escape_xml(text: string): string {
	return text.replace(/[&<>"']/g, (character) => XML_ENTITIES[character]);
}

function url_entry(site_url: string, { path, lastmod }: SitemapUrl): string {
	const loc = `<loc>${escape_xml(`${site_url}${path}`)}</loc>`;
	return lastmod
		? `<url>${loc}<lastmod>${new Date(lastmod).toISOString()}</lastmod></url>`
		: `<url>${loc}</url>`;
}

export function sitemap_xml(site_url: string, urls: SitemapUrl[]): string {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls.map((url) => url_entry(site_url, url)),
		'</urlset>',
		''
	].join('\n');
}
