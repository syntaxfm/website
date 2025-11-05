import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import type { Show } from '$server/db/types';
import { desc, eq, lte } from 'drizzle-orm';

// Reusable query fragments
const with_hosts = {
	with: {
		user: {
			columns: {
				id: true,
				username: true,
				name: true,
				twitter: true
			}
		}
	}
} as const;

const with_guests = {
	with: {
		guests: true
	}
} as const;

const with_ai_show_note_basic = {
	columns: {
		description: true
	},
	with: {
		topics: true
	}
} as const;

const with_ai_show_note_full = {
	with: {
		topics: true,
		links: true,
		summary: true,
		tweets: true
	}
} as const;

// Need a show card? this is your query
export const with_show_card_show = {
	guests: { with: { guest: true } },
	hosts: with_hosts,
	aiShowNote: with_ai_show_note_basic
} as const;

export async function get_last_10_shows() {
	return db.query.show.findMany({
		limit: 10,
		orderBy: [desc(show.number)],
		where: lte(show.date, new Date()),
		with: with_show_card_show
	});
}

export function get_show_detail_query(number: number) {
	return {
		where: eq(show.number, number),
		with: {
			...with_show_card_show,
			videos: {
				with: {
					video: {
						with: {
							playlists: {
								with: {
									playlist: true
								}
							}
						}
					}
				}
			},
			aiShowNote: with_ai_show_note_full
		}
	} as const;
}

// Type inference for show detail
export type ShowDetail = Show & {
	guests: Array<{ guest: any }>;
	hosts: Array<{
		user: { id: string; username: string | null; name: string | null; twitter: string | null };
	}>;
	videos: any[];
	aiShowNote: any;
};
