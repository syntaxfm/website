import { db } from '$server/db/client';
import get_show_path from '$utilities/slug';
import { error, redirect } from '@sveltejs/kit';
import { has_show_number, released_show_clause } from '$server/content/released';

export async function load(event) {
	const maybe_show_number = parseInt(event?.params?.number || '');
	if (isNaN(maybe_show_number)) error(404, 'Not found');

	// Is there a show with this number?
	const show = await db.query.show.findFirst({
		where: (show, { and, eq }) => and(eq(show.number, maybe_show_number), released_show_clause())
	});
	// No show found, pass it down the middleware chain - will probably 404, but that's sveltekit's job to figure that out, not ours!
	if (!show || !has_show_number(show)) error(404, 'Not found');

	const url = get_show_path(show);
	// syntax.fm/900, the URL said on air, permanently is the episode page
	redirect(301, url + event.url.search);
}
