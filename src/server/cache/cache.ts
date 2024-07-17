import { latest_shows, show } from '$server/shows/shows';

export const cache = {
	shows: {
		show,
		latest_shows
	}
};
