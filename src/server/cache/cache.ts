import {
	count_shows,
	drop_show_cache,
	drop_shows_list_cache,
	latest_shows,
	list_shows,
	show
} from '$server/shows/shows';

export const cache = {
	shows: {
		show,
		latest_shows,
		list_shows,
		count_shows,
		drop_show_cache,
		drop_shows_list_cache
	}
};
