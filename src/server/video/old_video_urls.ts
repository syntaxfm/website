import { eq, like } from 'drizzle-orm';
import { db } from '$server/db/client';
import { content, show, video } from '$server/db/schema';

// Where the old site's video URLs live now. It had /videos/[playlist] and
// /videos/[playlist]/[video]; videos now have one URL, /videos/[slug] (src/routes/(site)/videos),
// and those that turned out to be podcast episodes go to the episode.

// Every playlist the old site had pages for. Fixed: playlists aren't imported any more.
export const OLD_PLAYLIST_SLUGS: ReadonlySet<string> = new Set([
	'cj-syntax',
	'3-devs',
	'syntax-side-dish-explainers',
	'syntax-bytes-with-cj',
	'self-host-101',
	'vue-vs-react',
	'local-first-from-scratch'
]);

// Where the old playlist pages go, until /videos lists everything
export const OLD_PLAYLIST_DESTINATION = '/shows';

/** The current page for an old video slug, or null when there's none. */
export async function find_video_destination(old_slug: string): Promise<string | null> {
	const [row] = await db
		.select({ youtube_id: video.id, slug: content.slug, status: content.status })
		.from(video)
		.innerJoin(content, eq(content.id, video.content_id))
		.where(eq(video.slug, old_slug))
		.limit(1);
	if (!row) return null;
	if (row.status === 'PUBLISHED') return `/videos/${row.slug}`;

	// Archived because it's an episode's video (the sync leaves those out)
	const [episode] = await db
		.select({ number: show.number, slug: show.slug })
		.from(show)
		.where(like(show.youtube_url, `%${row.youtube_id}%`))
		.limit(1);
	return episode ? `/show/${episode.number}/${episode.slug}` : null;
}
