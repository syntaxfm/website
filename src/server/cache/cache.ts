import { count_shows, latest_shows, list_shows, show } from '$server/shows/shows';

export const cache = {
	shows: {
		show,
		latest_shows,
		list_shows,
		count_shows
	}
};
