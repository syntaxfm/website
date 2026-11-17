// Every public YouTube upload that isn't a podcast episode or a Short becomes VIDEO content, with
// its page at /videos/[slug]. YouTube is the source of truth, like Kit is for Snack Pack
// (src/server/newsletter/issues.ts): each sync refreshes title, description, picture, length and
// views. The slug is set once, at first import, so a renamed video keeps its URL. Status is never
// overwritten, so a video archived in admin stays archived; a full sync archives videos that are
// no longer public on YouTube.
import { and, eq, isNotNull, notInArray, sql } from 'drizzle-orm';
import slugify from 'speakingurl';
import { db } from '$server/db/client';
import { content, show, video } from '$server/db/schema';
import { get_id_from_url, SHORT_MAX_SECONDS } from '#lib/videos/utils.ts';
import { fetch_channel_videos, type ChannelVideo } from './channel_videos';

// Fewer site videos than this share of the published ones is more likely a YouTube hiccup than
// half the channel going private, so the sync stops before archiving anything
const MIN_SHARE_BEFORE_ARCHIVING = 0.5;
const INSERT_CHUNK = 200;

export type VideoSyncResult = {
	checked: number;
	site_videos: number;
	created: number;
	archived: number;
};

export function is_site_video(channel_video: ChannelVideo, episode_ids: ReadonlySet<string>) {
	return !episode_ids.has(channel_video.id) && channel_video.duration_seconds > SHORT_MAX_SECONDS;
}

// The title as a slug, with the video id on the end when another content row already has it
export function pick_video_slug(title: string, id: string, taken: ReadonlySet<string>): string {
	const base = slugify(title) || id.toLowerCase();
	if (!taken.has(base)) return base;
	return `${base}-${id.toLowerCase()}`;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let start = 0; start < items.length; start += size)
		chunks.push(items.slice(start, start + size));
	return chunks;
}

async function get_episode_video_ids(): Promise<Set<string>> {
	const rows = await db
		.select({ youtube_url: show.youtube_url })
		.from(show)
		.where(isNotNull(show.youtube_url));
	return new Set(rows.map((row) => get_id_from_url(row.youtube_url)).filter(Boolean));
}

/**
 * Copies the channel's videos into the site. `every_page` reads the whole channel and archives
 * videos that left it; otherwise only the newest 50 uploads are read and nothing is archived.
 */
export async function sync_channel_videos(
	api_key: string,
	{ every_page }: { every_page: boolean }
): Promise<VideoSyncResult> {
	const [channel_videos, episode_ids] = await Promise.all([
		fetch_channel_videos(api_key, { every_page }),
		get_episode_video_ids()
	]);
	const site_videos = channel_videos.filter((item) => is_site_video(item, episode_ids));

	const [existing_rows, slug_rows] = await Promise.all([
		db
			.select({ id: video.id, slug: content.slug })
			.from(video)
			.innerJoin(content, eq(content.id, video.content_id)),
		db.select({ slug: content.slug }).from(content)
	]);
	const slug_by_video_id = new Map(existing_rows.map((row) => [row.id, row.slug]));
	const taken_slugs = new Set(slug_rows.map((row) => row.slug));

	const rows = site_videos.map((item) => {
		const existing_slug = slug_by_video_id.get(item.id);
		const slug = existing_slug ?? pick_video_slug(item.title, item.id, taken_slugs);
		taken_slugs.add(slug);
		return { item, slug, is_new: !existing_slug };
	});

	if (every_page) {
		const [published] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(content)
			.where(and(eq(content.type, 'VIDEO'), eq(content.status, 'PUBLISHED')));
		if (site_videos.length < (published?.count ?? 0) * MIN_SHARE_BEFORE_ARCHIVING) {
			throw new Error(
				`YouTube returned ${site_videos.length} videos but ${published?.count} are published; not syncing`
			);
		}
	}

	const now = new Date();
	let archived = 0;

	await db.transaction(async (tx) => {
		const content_ids: string[] = [];
		for (const batch of chunk(rows, INSERT_CHUNK)) {
			const content_rows = await tx
				.insert(content)
				.values(
					batch.map(({ item, slug }) => ({
						title: item.title.slice(0, 255),
						slug,
						type: 'VIDEO' as const,
						status: 'PUBLISHED' as const,
						published_at: item.published_at,
						updated_at: now
					}))
				)
				// setWhere keeps a sync from ever touching another content type that shares a slug
				.onConflictDoUpdate({
					target: content.slug,
					set: {
						title: sql`excluded.title`,
						published_at: sql`excluded.published_at`,
						updated_at: sql`excluded.updated_at`
					},
					setWhere: eq(content.type, 'VIDEO')
				})
				.returning({ id: content.id, slug: content.slug });

			const content_id_by_slug = new Map(content_rows.map((row) => [row.slug, row.id]));
			const video_rows = batch.flatMap(({ item, slug }) => {
				const content_id = content_id_by_slug.get(slug);
				if (!content_id) return [];
				content_ids.push(content_id);
				return [
					{
						id: item.id,
						title: item.title,
						slug,
						description: item.description,
						url: `https://www.youtube.com/watch?v=${item.id}`,
						thumbnail: item.thumbnail,
						published_at: item.published_at,
						duration_seconds: item.duration_seconds,
						view_count: item.view_count,
						content_id
					}
				];
			});
			if (video_rows.length === 0) continue;

			await tx
				.insert(video)
				.values(video_rows)
				.onConflictDoUpdate({
					target: video.id,
					set: {
						title: sql`excluded.title`,
						description: sql`excluded.description`,
						thumbnail: sql`excluded.thumbnail`,
						published_at: sql`excluded.published_at`,
						duration_seconds: sql`excluded.duration_seconds`,
						view_count: sql`excluded.view_count`,
						content_id: sql`excluded.content_id`
					}
				});
		}

		// Only a full read of the channel knows what left it
		if (!every_page) return;
		const archived_rows = await tx
			.update(content)
			.set({ status: 'ARCHIVED', updated_at: now })
			.where(
				and(
					eq(content.type, 'VIDEO'),
					eq(content.status, 'PUBLISHED'),
					content_ids.length > 0 ? notInArray(content.id, content_ids) : undefined
				)
			)
			.returning({ id: content.id });
		archived = archived_rows.length;
	});

	return {
		checked: channel_videos.length,
		site_videos: site_videos.length,
		created: rows.filter((row) => row.is_new).length,
		archived
	};
}
