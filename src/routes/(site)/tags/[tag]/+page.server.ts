import { MIN_ITEMS_TO_INDEX_TAG, topic_description } from '#lib/seo/hubs.ts';
import { to_json_ld, topic_page_schema } from '#lib/seo/structured_data.ts';
import { get_content_by_tag } from './tags.remote';
import type { PageServerLoad } from './$types';

// The page's search tags. The page asks for the same query, which this request has already
// answered, so it costs nothing more.
export const load: PageServerLoad = async ({ params, url }) => {
	const { tag, items } = await get_content_by_tag(params.tag);
	const episodes = items.flatMap((item) =>
		item.type === 'PODCAST' && item.show ? [item.show] : []
	);
	const latest = items[0];
	const description = topic_description(
		tag.name,
		{ episodes: episodes.length, videos: items.filter((item) => item.type === 'VIDEO').length },
		latest?.show?.title ?? (latest?.type === 'VIDEO' ? latest.title : null) ?? null
	);
	const canonical = `${url.origin}/tags/${params.tag}`;

	return {
		meta: {
			title: `${tag.name} episodes`,
			description,
			canonical,
			noindex: items.length < MIN_ITEMS_TO_INDEX_TAG
		},
		schema_json: to_json_ld(
			topic_page_schema({ name: tag.name, slug: params.tag, description }, episodes, url.origin)
		)
	};
};
