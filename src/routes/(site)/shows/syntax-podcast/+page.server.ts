import { redirect } from '@sveltejs/kit';

export function load(event) {
	// The podcast episode grid was consolidated up to /shows. Permanently
	// redirect the old landing (and its ?page/?perPage state) so indexed URLs
	// and existing links collapse onto the single canonical index.
	redirect(301, '/shows' + event.url.search);
}
