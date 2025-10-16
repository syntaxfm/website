import { drop_show_cache, drop_shows_list_cache, list_shows, show } from '$server/shows/shows';

export const cache = {
	shows: {
		show,
		list_shows,

		drop_show_cache,
		drop_shows_list_cache
	}
};
