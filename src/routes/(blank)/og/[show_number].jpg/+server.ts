import { error } from '@sveltejs/kit';
import { get_og_image, og_image_key } from '$server/og/og_image';

// The image only changes when its show does, and a changed show gets a new stored image (its key
// is a hash of what it shows), so browsers keep it a day and Cloudflare's edge a week. Deploys
// purge the edge cache; the stored copy in R2 answers the next request without a new render.
const IMAGE_CACHE_CONTROL = `public, max-age=${60 * 60 * 24}, s-maxage=${60 * 60 * 24 * 7}`;

export async function GET({ url, params }) {
	// A show number, or a page's title (Meta.svelte)
	const show_number_or_title = params.show_number;
	const key = await og_image_key(show_number_or_title);
	if (!key) error(404, 'Show not found');

	const page_url = `${url.origin}/og/${encodeURIComponent(show_number_or_title)}`;
	const image = await get_og_image(key, page_url);

	return new Response(image.slice().buffer, {
		headers: { 'content-type': 'image/jpeg', 'cache-control': IMAGE_CACHE_CONTROL }
	});
}
