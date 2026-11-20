// Screenshots are drawn from the page, and a browser won't hand a page another site's image unless
// that site allows it. YouTube thumbnails and GitHub avatars don't, so the Report button reads them
// through the site's admin-only image proxy (src/routes/(site)/admin/image-proxy) instead.

export const IMAGE_PROXY_PATH = '/admin/image-proxy';

// Where the site's other-site images come from (github.com/<user>.png redirects to avatars)
export const IMAGE_PROXY_HOSTS = [
	'i.ytimg.com',
	'img.youtube.com',
	'yt3.ggpht.com',
	'github.com',
	'avatars.githubusercontent.com'
];

/** An https URL on one of the hosts, or null */
export function proxyable_image_url(url: string): URL | null {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' && IMAGE_PROXY_HOSTS.includes(parsed.hostname)
			? parsed
			: null;
	} catch {
		// Not a URL at all (a data: or relative URL the page resolves itself)
		return null;
	}
}

/** Where to read the image through the proxy, or null when it doesn't need it */
export function proxied_image_url(url: string): string | null {
	const image_url = proxyable_image_url(url);
	return image_url ? `${IMAGE_PROXY_PATH}?url=${encodeURIComponent(image_url.href)}` : null;
}
