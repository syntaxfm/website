import { isHttpError, redirect } from '@sveltejs/kit';
import { topic_description } from '#lib/seo/hubs.ts';
import { to_json_ld, topic_page_schema } from '#lib/seo/structured_data.ts';
import { find_tag_redirect } from '$server/tags/tag_redirects';
import { get_content_by_tag } from './tags.remote';
import type { PageServerLoad } from './$types';

// The tag's page, or, for a tag that was merged or renamed, a 301 to where it went. Only a missing
// tag asks about redirects.
async function load_tag(slug: string) {
	try {
		return await get_content_by_tag(slug);
	} catch (load_error) {
		if (!isHttpError(load_error) || load_error.status !== 404) throw load_error;
		const moved_to = await find_tag_redirect(slug);
		if (moved_to) redirect(301, `/tags/${moved_to}`);
		throw load_error;
	}
}

// The page's search tags. The page asks for the same query, which this request has already
// answered, so it costs nothing more.
export const load: PageServerLoad = async ({ params, url }) => {
	const { tag, items } = await load_tag(params.tag);
	const episodes = items.flatMap((item) =>
		item.type === 'PODCAST' && item.show ? [item.show] : []
	);
	const latest = items[0];
	const description = topic_description(
		tag.name,
		{ episodes: episodes.length, videos: items.filter((item) => item.type === 'VIDEO').length },
		latest?.show?.title ?? latest?.video?.title ?? null
	);
	const canonical = `${url.origin}/tags/${params.tag}`;

	return {
		meta: { title: `${tag.name} episodes`, description, canonical },
		schema_json: to_json_ld(
			topic_page_schema({ name: tag.name, slug: params.tag, description }, episodes, url.origin)
		)
	};
};
