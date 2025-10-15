import { prisma_client } from "$/server/prisma-client";
import { get_last_10_shows_query } from "$/server/shows/shows_queries";
import { query } from "$app/server";

export const getFeed = query(async () => {
	// TODO make this more than just last 10 podcasts
	const shows_query = get_last_10_shows_query();
	const feed = prisma_client.show.findMany(shows_query);
	return feed;
});

export const getMostPopularThisWeek = query(async () => {
	// TODO make this more than just last 10 podcasts
	const shows_query = get_last_10_shows_query();
	const feed = prisma_client.show.findMany(shows_query);
	return feed;
});
