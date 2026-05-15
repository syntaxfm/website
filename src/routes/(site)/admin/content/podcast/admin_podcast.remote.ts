import { command, form, getRequestEvent, query } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from '$server/db/client';
import {
	aiGuest,
	aiShowNote,
	aiSummaryEntry,
	aiTweet,
	guest,
	content,
	link,
	show,
	showGuest,
	showToUser,
	showVideo,
	socialLink,
	topic,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord,
	user,
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
import { and, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from 'drizzle-orm';
import { get_transcript } from '$server/transcripts/deepgram';
import { generate_ai_notes } from '$server/ai/openai';
import { save_ai_notes_to_db } from '$server/ai/db';
import { import_transcripts } from '$server/transcripts/transcripts';
import { DAYS_OF_WEEK_TYPES } from '$const';
import { get_hash_from_content } from '$utilities/file_utilities/get_hash_from_content';
import { left_pad } from '$utilities/left_pad';

const CONTENT_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const FILTER_STATUS_VALUES = [...CONTENT_STATUS_VALUES, 'ALL'] as const;

const list_shows_schema = v.object({
	search_text: v.optional(v.string()),
	status: v.optional(v.picklist(FILTER_STATUS_VALUES)),
	date_from_iso: v.optional(v.string()),
	date_to_iso: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const bulk_show_status_schema = v.object({
	show_numbers: v.pipe(v.array(v.number()), v.minLength(1)),
	status: v.picklist(CONTENT_STATUS_VALUES)
});

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

const user_search_schema = v.object({
	search_text: v.optional(v.string())
});

const show_host_schema = v.object({
	show_id: v.string(),
	user_id: v.string()
});

const update_ai_show_note_schema = v.object({
	id: v.number(),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	description: v.string()
});

const update_ai_summary_entry_schema = v.object({
	id: v.number(),
	time: v.pipe(v.string(), v.trim(), v.minLength(1)),
	text: v.pipe(v.string(), v.trim(), v.minLength(1)),
	description: v.optional(v.nullable(v.string()))
});

const update_ai_tweet_schema = v.object({
	id: v.number(),
	content: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(350))
});

const update_link_schema = v.object({
	id: v.number(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	url: v.pipe(v.string(), v.trim(), v.minLength(1)),
	timestamp: v.optional(v.nullable(v.string()))
});

const update_ai_guest_schema = v.object({
	id: v.number(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const update_topic_schema = v.object({
	id: v.number(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const ai_child_id_schema = v.object({
	id: v.number()
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

export const list_shows = query(list_shows_schema, async (input) => {
	assert_admin_user();

	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clauses = [];

	if (search_text.length > 0) {
		where_clauses.push(ilike(show.title, `%${search_text}%`));
	}

	if (status !== 'ALL') {
		where_clauses.push(
			inArray(
				show.content_id,
				db
					.select({ id: content.id })
					.from(content)
					.where(eq(content.status, status))
			)
		);
	}

	const date_from = parse_optional_iso_date(input.date_from_iso);
	if (date_from) {
		where_clauses.push(gte(show.date, date_from));
	}

	const date_to = parse_optional_iso_date(input.date_to_iso);
	if (date_to) {
		where_clauses.push(lte(show.date, date_to));
	}

	const where_clause = where_clauses.length > 0 ? and(...where_clauses) : undefined;

	const total_rows = where_clause
		? await db.select({ total: sql<number>`count(*)` }).from(show).where(where_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(show);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.show.findMany({
		where: where_clause,
		with: {
			meta: true
		},
		orderBy: [desc(show.number)],
		limit: page_size,
		offset
	});

	return {
		items,
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
});

export const bulk_update_show_status = command(bulk_show_status_schema, async (input) => {
	assert_admin_user();

	const existing_shows = await db.query.show.findMany({
		where: inArray(show.number, input.show_numbers),
		columns: {
			number: true,
			content_id: true
		}
	});

	const updatable_content_ids = existing_shows
		.map((row) => row.content_id)
		.filter((maybe_id): maybe_id is string => Boolean(maybe_id));

	const skipped_count = existing_shows.length - updatable_content_ids.length;

	if (updatable_content_ids.length === 0) {
		return { success: true, count: 0, skipped_count };
	}

	const set_values: {
		status: (typeof CONTENT_STATUS_VALUES)[number];
		updated_at: Date;
		published_at?: Date | null | ReturnType<typeof sql>;
	} = {
		status: input.status,
		updated_at: new Date()
	};

	if (input.status === 'PUBLISHED') {
		set_values.published_at = sql`coalesce(${content.published_at}, now())`;
	}

	if (input.status === 'DRAFT') {
		set_values.published_at = null;
	}

	await db.update(content).set(set_values).where(inArray(content.id, updatable_content_ids));

	return {
		success: true,
		count: updatable_content_ids.length,
		skipped_count
	};
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
			aiShowNote: {
				with: {
					summary: true,
					tweets: true,
					links: true,
					guests: true,
					topics: true
				}
			},
			guests: {
				with: {
					guest: true
				}
			},
			hosts: {
				with: {
					user: true
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
			},
			transcript: {
				columns: {
					id: true
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

// ============================================================================
// HOST PANEL — search and attach Users to a Show
// ============================================================================

export const search_users_for_host = query(user_search_schema, async ({ search_text }) => {
	assert_admin_user();

	const normalized_search = search_text?.trim() || '';

	const where_clause = normalized_search
		? or(
				ilike(user.username, `%${normalized_search}%`),
				ilike(user.name, `%${normalized_search}%`),
				ilike(user.email, `%${normalized_search}%`)
			)
		: undefined;

	return db.query.user.findMany({
		where: where_clause,
		columns: {
			id: true,
			username: true,
			name: true,
			email: true
		},
		orderBy: (user_item, { asc }) => [asc(user_item.username)],
		limit: 25
	});
});

export const add_show_host = command(show_host_schema, async ({ show_id, user_id }) => {
	assert_admin_user();

	await db
		.insert(showToUser)
		.values({
			show_id,
			user_id
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_show_host = command(show_host_schema, async ({ show_id, user_id }) => {
	assert_admin_user();

	await db
		.delete(showToUser)
		.where(and(eq(showToUser.show_id, show_id), eq(showToUser.user_id, user_id)));

	return { success: true };
});

// ============================================================================
// AI ARTIFACT EDITORIAL CRUD
// AI artifacts have no status column; regeneration replaces them wholesale.
// See docs/CONTEXT.md → "AI-generated content" and the lifecycle paragraph.
// ============================================================================

export const update_ai_show_note = command(update_ai_show_note_schema, async (input) => {
	assert_admin_user();

	await db
		.update(aiShowNote)
		.set({
			title: input.title,
			description: input.description
		})
		.where(eq(aiShowNote.id, input.id));

	return { success: true };
});

export const update_ai_summary_entry = command(update_ai_summary_entry_schema, async (input) => {
	assert_admin_user();

	await db
		.update(aiSummaryEntry)
		.set({
			time: input.time,
			text: input.text,
			description: input.description ?? null
		})
		.where(eq(aiSummaryEntry.id, input.id));

	return { success: true };
});

export const update_ai_tweet = command(update_ai_tweet_schema, async (input) => {
	assert_admin_user();

	await db
		.update(aiTweet)
		.set({
			content: input.content
		})
		.where(eq(aiTweet.id, input.id));

	return { success: true };
});

export const update_link = command(update_link_schema, async (input) => {
	assert_admin_user();

	await db
		.update(link)
		.set({
			name: input.name,
			url: input.url,
			timestamp: input.timestamp ?? null
		})
		.where(eq(link.id, input.id));

	return { success: true };
});

export const update_ai_guest = command(update_ai_guest_schema, async (input) => {
	assert_admin_user();

	await db
		.update(aiGuest)
		.set({
			name: input.name
		})
		.where(eq(aiGuest.id, input.id));

	return { success: true };
});

export const update_topic = command(update_topic_schema, async (input) => {
	assert_admin_user();

	await db
		.update(topic)
		.set({
			name: input.name
		})
		.where(eq(topic.id, input.id));

	return { success: true };
});

export const delete_ai_summary_entry = command(ai_child_id_schema, async ({ id }) => {
	assert_admin_user();

	await db.delete(aiSummaryEntry).where(eq(aiSummaryEntry.id, id));

	return { success: true };
});

export const delete_ai_tweet = command(ai_child_id_schema, async ({ id }) => {
	assert_admin_user();

	await db.delete(aiTweet).where(eq(aiTweet.id, id));

	return { success: true };
});

export const delete_link = command(ai_child_id_schema, async ({ id }) => {
	assert_admin_user();

	await db.delete(link).where(eq(link.id, id));

	return { success: true };
});

export const delete_ai_guest = command(ai_child_id_schema, async ({ id }) => {
	assert_admin_user();

	await db.delete(aiGuest).where(eq(aiGuest.id, id));

	return { success: true };
});

export const delete_topic = command(ai_child_id_schema, async ({ id }) => {
	assert_admin_user();

	await db.delete(topic).where(eq(topic.id, id));

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
