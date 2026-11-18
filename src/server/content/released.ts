import { and, eq, lte } from 'drizzle-orm';
import { content, show } from '$server/db/schema';

// What visitors may see. Episodes are imported ahead of their release date (shows/*.md is dated),
// published, so "published" alone isn't enough: a scheduled episode would show in the feed, Most
// Popular, the player bar and its neighbour's next link days early. Every public query uses these.

/** Content the site has released: published and dated now or earlier. */
export function released_content_clause() {
	return and(eq(content.status, 'PUBLISHED'), lte(content.published_at, new Date()));
}

/** For queries on the shows table: the episode's date has come. */
export function released_show_clause() {
	return lte(show.date, new Date());
}

/** For rows already loaded, such as an episode reached through a relation that can't be filtered. */
export function is_released(date: Date | string | null | undefined): boolean {
	if (!date) return false;
	return new Date(date) <= new Date();
}
