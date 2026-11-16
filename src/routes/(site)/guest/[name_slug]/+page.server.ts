import { error } from '@sveltejs/kit';
import { guest_description } from '#lib/seo/hubs.ts';
import { guest_page_schema, to_json_ld } from '#lib/seo/structured_data.ts';
import { get_guest } from '../guests.remote';
import type { PageServerLoad } from './$types';

// The page's search tags. The page asks for the same query, which this request has already
// answered, so it costs nothing more.
export const load: PageServerLoad = async ({ params, url }) => {
	const guest = await get_guest(params.name_slug);
	if (!guest) error(404, 'Guest not found');

	const now = Date.now();
	const episodes = guest.showGuests
		.flatMap(({ show }) => (show && new Date(show.date).getTime() <= now ? [show] : []))
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	const description = guest_description(
		guest,
		episodes.map((episode) => episode.title)
	);

	return {
		meta: {
			title: `${guest.name} on Syntax`,
			description,
			canonical: `${url.origin}/guest/${guest.name_slug}`
		},
		schema_json: to_json_ld(guest_page_schema(guest, description, episodes, url.origin))
	};
};
