import { get_last_10_shows } from '$/server/shows/shows_queries';
import { query } from '$app/server';

export const getFeed = query(async () => {
	// TODO make this more than just last 10 podcasts
	return get_last_10_shows();
});

export const getMostPopularThisWeek = query(async () => {
	// TODO make this more than just last 10 podcasts
	return get_last_10_shows();
});
