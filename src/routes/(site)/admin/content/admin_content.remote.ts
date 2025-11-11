import { command, query } from '$app/server';
import { db } from '$server/db/client';
import { content, show, video } from '$server/db/schema';
import { eq } from 'drizzle-orm';

// TEMP FUNCTION CAN BE REMOVED AFTER MIGRATION
// this finds shows and videos and makes content from them
export const populate_content_from_existing_data = command(async () => {
	try {
		// Global slug counter across ALL content types (shows, videos, etc.)
		// This ensures slugs are unique in the content table even if shows/videos share slugs
		const slug_counts = new Map<string, number>();

		const shows = await db.query.show.findMany();
		let show_counter = 0;

		for (const show_item of shows) {
			// Skip if already has content_id
			if (show_item.content_id) {
				continue;
			}

			// Handle duplicate slugs by appending a counter
			let unique_slug = show_item.slug;
			const count = slug_counts.get(show_item.slug) || 0;
			if (count > 0) {
				unique_slug = `${show_item.slug}-${count}`;
			}
			slug_counts.set(show_item.slug, count + 1);

			try {
				// Use transaction to ensure atomicity
				await db.transaction(async (tx) => {
					// 1. Create the content record
					const [new_content] = await tx
						.insert(content)
						.values({
							title: show_item.title,
							slug: unique_slug,
							type: 'PODCAST',
							status: 'PUBLISHED',
							created_at: show_item.created_at,
							updated_at: new Date(),
							published_at: show_item.date
						})
						.returning();

					// 2. Update the show with the content_id
					await tx
						.update(show)
						.set({ content_id: new_content.id })
						.where(eq(show.id, show_item.id));
				});

				show_counter++;
			} catch (err) {
				console.error(`Failed to process show ${show_item.id}:`, err);
				// Continue with next show
			}
		}

		const videos = await db.query.video.findMany();
		let video_counter = 0;
		// DON'T clear slug_counts - we need to track across all content types!

		for (const video_item of videos) {
			// Skip if already has content_id
			if (video_item.content_id) {
				continue;
			}

			// Handle duplicate slugs by appending a counter
			let unique_slug = video_item.slug;
			const count = slug_counts.get(video_item.slug) || 0;
			if (count > 0) {
				unique_slug = `${video_item.slug}-${count}`;
			}
			slug_counts.set(video_item.slug, count + 1);

			try {
				// Use transaction to ensure atomicity
				await db.transaction(async (tx) => {
					// 1. Create the content record
					const [new_content] = await tx
						.insert(content)
						.values({
							title: video_item.title,
							slug: unique_slug,
							type: 'VIDEO',
							status: 'PUBLISHED',
							created_at: new Date(),
							updated_at: new Date(),
							published_at: video_item.published_at
						})
						.returning();

					// 2. Update the video with the content_id
					await tx
						.update(video)
						.set({ content_id: new_content.id })
						.where(eq(video.id, video_item.id));
				});

				video_counter++;
			} catch (err) {
				console.error(`Failed to process video ${video_item.id}:`, err);
				// Continue with next video
			}
		}

		return { success: true, shows: show_counter, videos: video_counter };
	} catch (error) {
		console.error('Error populating content:', error);
		return { success: false, error: 'Failed to populate content' };
	}
});

export const get_all_content = query(async () => {
	const all_content = await db.query.content.findMany({
		orderBy: (content, { desc }) => [desc(content.published_at)]
	});
	return all_content;
});
