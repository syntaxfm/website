import { command, form, getRequestEvent, query } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from '$server/db/client';
import {
	aiShowNote,
	guest,
	content,
	show,
	showGuest,
	showVideo,
	socialLink,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord,
	video
} from '$server/db/schema';
import {
	syncAllEpisodesSpotifyData,
	syncEpisodeSpotifyData,
	type MegaphoneCredentials
} from '$server/megaphone/sync';
import * as v from 'valibot';
import {
	get_id_from_show_number,
	import_or_update_all_changed_shows,
	import_or_update_all_shows
} from '$server/shows';
import { error } from '@sveltejs/kit';
import { and, eq, ilike, ne } from 'drizzle-orm';
import { get_transcript } from '$server/transcripts/deepgram';
import { generate_ai_notes } from '$server/ai/openai';
import { save_ai_notes_to_db } from '$server/ai/db';
import { import_transcripts } from '$server/transcripts/transcripts';
import { DAYS_OF_WEEK_TYPES } from '$const';
import { get_hash_from_content } from '$utilities/file_utilities/get_hash_from_content';
import { left_pad } from '$utilities/left_pad';

const CONTENT_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const update_show_editor_schema = v.object({
	show_number: v.number(),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.picklist(CONTENT_STATUS_VALUES),
	published_at_iso: v.optional(v.nullable(v.string())),
	show_notes: v.string(),
	url: v.pipe(v.string(), v.trim(), v.minLength(1)),
	youtube_url: v.optional(v.nullable(v.string()))
});

const create_show_editor_schema = v.object({
	show_number: v.number(),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.picklist(CONTENT_STATUS_VALUES),
	published_at_iso: v.optional(v.nullable(v.string())),
	show_notes: v.string(),
	url: v.pipe(v.string(), v.trim(), v.minLength(1)),
	youtube_url: v.optional(v.nullable(v.string()))
});

const show_number_schema = v.object({
	show_number: v.number()
});

const guest_search_schema = v.object({
	search_text: v.optional(v.string())
});

const show_guest_schema = v.object({
	show_id: v.string(),
	guest_id: v.string()
});

const video_search_schema = v.object({
	search_text: v.optional(v.string()),
	limit: v.optional(v.number())
});

const show_video_schema = v.object({
	show_id: v.string(),
	video_id: v.string()
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
}

function parse_optional_iso_date(maybe_iso: string | null | undefined) {
	if (!maybe_iso) {
		return null;
	}

	const parsed_date = new Date(maybe_iso);
	if (Number.isNaN(parsed_date.getTime())) {
		return null;
	}

	return parsed_date;
}

// Helper function to sync Spotify data for specific shows
async function syncShowsSpotifyData(showNumbers: number[]): Promise<void> {
	const credentials: MegaphoneCredentials = {
		apiToken: env.MEGAPHONE_API_TOKEN as string,
		networkId: env.MEGAPHONE_NETWORK_ID as string,
		podcastId: env.MEGAPHONE_PODCAST_ID as string
	};

	for (const showNumber of showNumbers) {
		try {
			await syncEpisodeSpotifyData(showNumber, credentials);
		} catch (error) {
			console.error(`🎵 Failed to sync Spotify data for show ${showNumber}:`, error);
		}
	}
}

export const get_all_shows = query(async () => {
	assert_admin_user();

	return db.query.show.findMany({
		orderBy: (content, { desc }) => [desc(content.number)],
		with: {
			meta: true,
			guests: true,
			aiShowNote: {
				columns: {
					id: true
				}
			},
			transcript: {
				columns: {
					id: true
				}
			}
		}
	});
});

export const get_show_editor = query(v.number(), async (show_number) => {
	assert_admin_user();

	return db.query.show.findFirst({
		where: eq(show.number, show_number),
		with: {
			meta: {
				with: {
					tags: {
						with: {
							tag: true
						}
					}
				}
			},
			aiShowNote: true,
			guests: {
				with: {
					guest: true
				}
			},
			videos: {
				with: {
					video: {
						with: {
							meta: true
						}
					}
				}
			}
		}
	});
});

export const create_show_editor = command(create_show_editor_schema, async (input) => {
	assert_admin_user();

	const duplicate_show_number = await db.query.show.findFirst({
		where: eq(show.number, input.show_number),
		columns: {
			id: true
		}
	});

	if (duplicate_show_number) {
		error(409, 'Show number already exists');
	}

	const duplicate_slug = await db.query.content.findFirst({
		where: eq(content.slug, input.slug),
		columns: {
			id: true
		}
	});

	if (duplicate_slug) {
		error(409, 'Slug already exists on another content item');
	}

	let next_published_at = parse_optional_iso_date(input.published_at_iso || null);
	if (input.status === 'PUBLISHED' && !next_published_at) {
		next_published_at = new Date();
	}

	const show_date = next_published_at || new Date();
	const show_id = get_id_from_show_number(input.show_number);
	const day_of_week = show_date.getDay();
	const show_type = DAYS_OF_WEEK_TYPES[day_of_week] || 'SPECIAL';
	const md_file = `/shows/${left_pad(input.show_number)} - ${input.slug}.md`;
	const hash = await get_hash_from_content(
		`${input.show_number}:${input.title}:${input.slug}:${input.url}:${input.show_notes}`
	);

	const created_content = await db.transaction(async (tx) => {
		const [inserted_content] = await tx
			.insert(content)
			.values({
				title: input.title,
				slug: input.slug,
				type: 'PODCAST',
				status: input.status,
				published_at: next_published_at
			})
			.returning({ id: content.id });

		await tx.insert(show).values({
			id: show_id,
			number: input.show_number,
			title: input.title,
			slug: input.slug,
			date: show_date,
			url: input.url,
			youtube_url: input.youtube_url || null,
			show_notes: input.show_notes,
			show_type,
			hash,
			md_file,
			content_id: inserted_content.id,
			updated_at: new Date()
		});

		return inserted_content;
	});

	return {
		success: true,
		show_number: input.show_number,
		content_id: created_content.id,
		show_id
	};
});

export const update_show_editor = command(update_show_editor_schema, async (input) => {
	assert_admin_user();

	const existing_show = await db.query.show.findFirst({
		where: eq(show.number, input.show_number),
		columns: {
			id: true,
			date: true,
			content_id: true
		}
	});

	if (!existing_show) {
		error(404, 'Show not found');
	}

	let next_published_at = parse_optional_iso_date(input.published_at_iso || null);
	if (input.status === 'PUBLISHED' && !next_published_at) {
		next_published_at = new Date();
	}

	await db
		.update(show)
		.set({
			title: input.title,
			slug: input.slug,
			show_notes: input.show_notes,
			url: input.url,
			youtube_url: input.youtube_url || null,
			date: next_published_at || existing_show.date,
			updated_at: new Date()
		})
		.where(eq(show.number, input.show_number));

	if (existing_show.content_id) {
		const duplicate_slug = await db.query.content.findFirst({
			where: and(eq(content.slug, input.slug), ne(content.id, existing_show.content_id)),
			columns: {
				id: true
			}
		});

		if (duplicate_slug) {
			error(409, 'Slug already exists on another content item');
		}

		await db
			.update(content)
			.set({
				title: input.title,
				slug: input.slug,
				status: input.status,
				published_at: next_published_at,
				updated_at: new Date()
			})
			.where(eq(content.id, existing_show.content_id));
	}

	return { success: true };
});

export const sync_spotify_for_show = command(show_number_schema, async ({ show_number }) => {
	assert_admin_user();

	if (!env.MEGAPHONE_API_TOKEN || !env.MEGAPHONE_NETWORK_ID || !env.MEGAPHONE_PODCAST_ID) {
		error(
			500,
			'Missing required Megaphone environment variables: MEGAPHONE_API_TOKEN, MEGAPHONE_NETWORK_ID, MEGAPHONE_PODCAST_ID'
		);
	}

	const credentials: MegaphoneCredentials = {
		apiToken: env.MEGAPHONE_API_TOKEN,
		networkId: env.MEGAPHONE_NETWORK_ID,
		podcastId: env.MEGAPHONE_PODCAST_ID
	};

	await syncEpisodeSpotifyData(show_number, credentials);

	return {
		success: true,
		message: 'Spotify sync completed successfully'
	};
});

export const search_guests = query(guest_search_schema, async ({ search_text }) => {
	assert_admin_user();

	const normalized_search = search_text?.trim() || '';

	return db.query.guest.findMany({
		where: normalized_search ? ilike(guest.name, `%${normalized_search}%`) : undefined,
		columns: {
			id: true,
			name: true,
			name_slug: true
		},
		orderBy: (guest_item, { asc }) => [asc(guest_item.name)],
		limit: 25
	});
});

export const add_show_guest = command(show_guest_schema, async ({ show_id, guest_id }) => {
	assert_admin_user();

	await db
		.insert(showGuest)
		.values({
			show_id,
			guest_id
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_show_guest = command(show_guest_schema, async ({ show_id, guest_id }) => {
	assert_admin_user();

	await db
		.delete(showGuest)
		.where(and(eq(showGuest.show_id, show_id), eq(showGuest.guest_id, guest_id)));

	return { success: true };
});

export const search_videos = query(video_search_schema, async ({ search_text, limit }) => {
	assert_admin_user();

	const normalized_search = search_text?.trim() || '';
	const max_results = Math.min(100, Math.max(1, limit || 25));

	return db.query.video.findMany({
		where: normalized_search ? ilike(video.title, `%${normalized_search}%`) : undefined,
		with: {
			meta: true
		},
		orderBy: (video_item, { desc }) => [desc(video_item.published_at)],
		limit: max_results
	});
});

export const add_show_video = command(show_video_schema, async ({ show_id, video_id }) => {
	assert_admin_user();

	await db
		.insert(showVideo)
		.values({
			show_id,
			video_id
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_show_video = command(show_video_schema, async ({ show_id, video_id }) => {
	assert_admin_user();

	await db
		.delete(showVideo)
		.where(and(eq(showVideo.show_id, show_id), eq(showVideo.video_id, video_id)));

	return { success: true };
});

export const import_all_transcripts = command(async () => {
	assert_admin_user();

	await import_transcripts();
	return { success: true, message: 'Transcripts import completed' };
});

export const delete_all_transcripts = command(async () => {
	assert_admin_user();

	await db.delete(transcript);
	return { success: true, message: 'Deleted all transcripts' };
});

export const import_all_shows = form(async () => {
	assert_admin_user();

	console.log('🤖 Pod Sync Requested via Admin');
	const result = await import_or_update_all_changed_shows();

	if (result.updatedShows && result.updatedShows.length > 0) {
		try {
			await syncShowsSpotifyData(result.updatedShows);
		} catch (error) {
			console.error('🎵 Spotify sync failed:', error);
		}
	}

	console.log(result);
	return result;
});

export const refresh_all = form(async () => {
	assert_admin_user();

	console.log('🤖 Pod Refresh Requested via Admin');
	const result = await import_or_update_all_shows();

	try {
		const credentials: MegaphoneCredentials = {
			apiToken: env.MEGAPHONE_API_TOKEN as string,
			networkId: env.MEGAPHONE_NETWORK_ID as string,
			podcastId: env.MEGAPHONE_PODCAST_ID as string
		};
		await syncAllEpisodesSpotifyData(credentials);
	} catch (error) {
		console.error('🎵 Spotify sync failed:', error);
	}

	return result;
});

export const delete_all_shows = form(async () => {
	assert_admin_user();

	// Order of these is important because of how db relations work
	await db.delete(showGuest);
	await db.delete(transcriptUtteranceWord);
	await db.delete(transcriptUtterance);
	await db.delete(transcript);
	await db.delete(aiShowNote);
	await db.delete(show);
	await db.delete(socialLink);
	await db.delete(guest);
	return { message: 'Delete All Shows' };
});

export const delete_transcript = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		assert_admin_user();

		await db.delete(transcript).where(eq(transcript.show_number, show_number));
		return { message: `Deleted Transcript for Show ${show_number}` };
	}
);

export const fetch_show_transcript = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		assert_admin_user();

		await get_transcript(show_number);
		console.log('🤖 transcript fetch requested');
		return { message: 'Transcript Fetch Requested' };
	}
);

// fetch_AI_notes: aiNoteRequestHandler
export const fetch_AI_notes = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		assert_admin_user();

		const current_show = await db.query.show.findFirst({
			where: eq(show.number, show_number),
			with: {
				transcript: {
					with: {
						utterances: {
							columns: {
								id: true,
								start: true,
								end: true,
								confidence: true,
								channel: true,
								transcript_value: true,
								speaker: true,
								speaker_name: true,
								transcript_id: true
							},
							orderBy: (utterances, { asc }) => [asc(utterances.start)]
						}
					}
				}
			}
		});

		if (!current_show?.transcript) {
			error(400, 'No show, or no transcript for this show');
		}

		// delete any existing ai notes
		await db.delete(aiShowNote).where(eq(aiShowNote.show_number, show_number));

		// Get the AI transcript for this show
		const result = await generate_ai_notes(current_show);
		// Save to DB
		console.log(`🤖 Saving AI Notes to DB for Show ${show_number}`);
		console.dir(result);
		await save_ai_notes_to_db(result, current_show);

		return { message: 'AI Notes Created' };
	}
);
