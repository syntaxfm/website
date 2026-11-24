import { and, eq, inArray, lte } from 'drizzle-orm';
import { db } from '$server/db/client';
import { content, show } from '$server/db/schema';

// What visitors may see: content that is published and dated now or earlier. Published alone isn't
// enough (a scheduled episode would show in the feed, Most Popular, the player bar and its
// neighbour's next link days early), and the date alone isn't either (a draft is dated the day it is
// made). Every public query uses these.

/** Content the site has released: published and dated now or earlier. */
export function released_content_clause() {
	return and(eq(content.status, 'PUBLISHED'), lte(content.published_at, new Date()));
}

/** For queries on the shows table: the episode's content is released. */
export function released_show_clause() {
	return inArray(
		show.content_id,
		db.select({ id: content.id }).from(content).where(released_content_clause())
	);
}

/** For a content row already loaded, such as one reached through a relation that can't be filtered. */
export function is_released(
	item: { status: string; published_at: Date | string | null } | null | undefined
): boolean {
	if (!item?.published_at || item.status !== 'PUBLISHED') return false;
	return new Date(item.published_at) <= new Date();
}

// Publishing an episode needs its number and audio URL (show_editor.ts), so every released episode
// has both. These narrow the type for public code, and drop a row that somehow lacks them.

/** The episode has its number. */
export function has_show_number<T extends { number: number | null }>(
	row: T
): row is T & { number: number } {
	return row.number !== null;
}

/** The episode has its number and audio URL. */
export function is_complete_episode<T extends { number: number | null; url: string | null }>(
	row: T
): row is T & { number: number; url: string } {
	return row.number !== null && row.url !== null;
}

/** A content row whose episode is narrowed by is_complete_episode (null when it isn't complete). */
export function with_complete_show<
	T extends { show: { number: number | null; url: string | null } | null }
>(
	row: T
): Omit<T, 'show'> & { show: (NonNullable<T['show']> & { number: number; url: string }) | null } {
	return { ...row, show: row.show && is_complete_episode(row.show) ? row.show : null };
}
