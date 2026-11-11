import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import type {
	AiShowNote,
	AiSummaryEntry,
	AiTweet,
	Guest,
	Link,
	Playlist,
	Show,
	Topic,
	Video
} from '$server/db/types';
import { and, desc, eq, like, lte } from 'drizzle-orm';
import { edge_cached } from '$server/edge_cache';
import type { PlayerShow } from '$state/player_utils';
import { get_id_from_url } from '#lib/videos/utils.ts';

// Reusable query fragments
const with_hosts = {
	with: {
		profile: {
			columns: {
				id: true,
				username: true,
				name: true,
				twitter: true
			}
		}
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

/**
 * The released episode a YouTube video belongs to, as the player takes it. Null for videos that
 * aren't an episode. Edge cached: Home asks on every render, and the answer only changes when
 * shows are imported.
 */
export function get_player_show_for_video(video_id: string): Promise<PlayerShow | null> {
	return edge_cached(
		`player-show-for-video-${video_id}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		async () => {
			const candidates = await db.query.show.findMany({
				columns: { number: true, title: true, slug: true, url: true, youtube_url: true },
				where: and(like(show.youtube_url, `%${video_id}%`), lte(show.date, new Date())),
				limit: 5
			});
			// `_` in a video id matches any character in LIKE, so compare the ids themselves
			return candidates.find((c) => get_id_from_url(c.youtube_url) === video_id) ?? null;
		}
	);
}

export function get_show_detail_query(number: number) {
	return {
		where: eq(show.number, number),
		with: {
			...with_show_card_show,
			meta: {
				with: {
					tags: {
						with: { tag: true }
					}
				}
			},
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
	guests: Array<{ guest: Guest }>;
	hosts: Array<{
		user: { id: string; username: string | null; name: string | null; twitter: string | null };
	}>;
	videos: Array<{ video: Video & { playlists: Array<{ playlist: Playlist }> } }>;
	aiShowNote: AiShowNote & {
		topics: Topic[];
		links: Link[];
		summary: AiSummaryEntry[];
		tweets: AiTweet[];
	};
};
