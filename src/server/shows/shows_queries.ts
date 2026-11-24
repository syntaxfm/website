import { in_order_added } from '#lib/utils/in_order_added.ts';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import type {
	AiShowNote,
	AiSummaryEntry,
	AiTweet,
	Guest,
	Link,
	Show,
	Topic
} from '$server/db/types';
import { and, desc, eq, like } from 'drizzle-orm';
import { edge_cached } from '$server/edge_cache';
import type { PlayerShow } from '$state/player_utils';
import { get_id_from_url } from '#lib/videos/utils.ts';
import { is_complete_episode, released_show_clause } from '$server/content/released';

// Reusable query fragments
const with_hosts = {
	orderBy: in_order_added,
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
	guests: { orderBy: in_order_added, with: { guest: true } },
	hosts: with_hosts,
	aiShowNote: with_ai_show_note_basic
} as const;

export async function get_last_10_shows() {
	const rows = await db.query.show.findMany({
		limit: 10,
		orderBy: [desc(show.number)],
		where: released_show_clause(),
		with: with_show_card_show
	});
	return rows.filter(is_complete_episode);
}

/**
 * The released episode a YouTube video belongs to, as the player takes it. Null for videos that
 * aren't an episode. Edge cached: Home asks on every render, and the answer only changes when
 * shows are imported.
 */
export function get_player_show_for_video(video_id: string): Promise<PlayerShow | null> {
	return edge_cached(
		`player-show-for-video-2-${video_id}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		async () => {
			const candidates = await db.query.show.findMany({
				columns: { number: true, title: true, slug: true, url: true, youtube_url: true },
				where: and(like(show.youtube_url, `%${video_id}%`), released_show_clause()),
				limit: 5
			});
			// `_` in a video id matches any character in LIKE, so compare the ids themselves
			return (
				candidates
					.filter(is_complete_episode)
					.find((c) => get_id_from_url(c.youtube_url) === video_id) ?? null
			);
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
			aiShowNote: with_ai_show_note_full,
			// Whether there is one, for the episode's JSON-LD; the lines load on the transcript page
			transcript: { columns: { id: true } }
		}
	} as const;
}

// Type inference for show detail
export type ShowDetail = Show & {
	guests: Array<{ guest: Guest }>;
	hosts: Array<{
		user: { id: string; username: string | null; name: string | null; twitter: string | null };
	}>;
	aiShowNote: AiShowNote & {
		topics: Topic[];
		links: Link[];
		summary: AiSummaryEntry[];
		tweets: AiTweet[];
	};
};
