import { prisma_client } from '$/server/prisma-client';
import get_show_path from '$/utilities/slug';
import { error, redirect } from '@sveltejs/kit';

export async function load(event) {
	let maybe_show_number = parseInt(event?.params?.number || '');
	if (isNaN(maybe_show_number)) error(404, 'Not found');

	// Is there a show with this number?
	const show = await prisma_client.show.findUnique({ where: { number: maybe_show_number } });
	// No show found, pass it down the middleware chain - will probably 404, but thats sveltekit's job to figure that out, not ours!
	if (!show) error(404, 'Not found');

	const url = get_show_path(show);
	// Redirect to the page for this show
	throw redirect(302, url + event.url.search);
}
