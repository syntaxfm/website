import { command, form, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';

import { MEGAPHONE_API_TOKEN, MEGAPHONE_NETWORK_ID, MEGAPHONE_PODCAST_ID } from '$app/env/private';

import { db } from '$server/db/client';
import {
	aiGuest,
	aiShowNote,
	aiSummaryEntry,
	aiTweet,
	content,
	guest,
	link,
	profile,
	show,
	showGuest,
	showToProfile,
	socialLink,
	topic,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord
} from '$server/db/schema';
import {
	syncAllEpisodesSpotifyData,
	syncEpisodeSpotifyData,
	type MegaphoneCredentials
} from '$server/megaphone/sync';
import * as v from 'valibot';
import { import_or_update_all_changed_shows, import_or_update_all_shows } from '$server/shows';
import * as show_editor from '$server/shows/show_editor';
import { error } from '@sveltejs/kit';
import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { get_transcript } from '$server/transcripts/grok';
import * as transcript_editor from '$server/transcripts/transcript_editor';
import { generate_ai_notes } from '$server/ai/openai';

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
	youtube_url: v.optional(v.nullable(v.string())),
	host_ids: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1)))),
	guest_ids: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1)))),
	tag_ids: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))))
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

const show_number_schema = v.object({ show_number: v.number() });
const guest_search_schema = v.object({ search_text: v.optional(v.string()) });
const show_guest_schema = v.object({ show_id: v.string(), guest_id: v.string() });

const user_search_schema = v.object({ search_text: v.optional(v.string()) });
const show_host_schema = v.object({ show_id: v.string(), user_id: v.string() });

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

const add_ai_summary_entry_schema = v.object({
	show_note_id: v.number(),
	time: v.pipe(v.string(), v.trim(), v.minLength(1)),
	text: v.pipe(v.string(), v.trim(), v.minLength(1)),
	description: v.optional(v.nullable(v.string()))
});

const add_ai_tweet_schema = v.object({
	show_note_id: v.number(),
	content: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(350))
});

const add_link_schema = v.object({
	show_note_id: v.number(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	url: v.pipe(v.string(), v.trim(), v.minLength(1)),
	timestamp: v.optional(v.nullable(v.string()))
});

const add_ai_guest_schema = v.object({
	show_note_id: v.number(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const add_topic_schema = v.object({
	show_note_id: v.number(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1))
});

async function assert_ai_show_note_exists(show_note_id: number) {
	const parent = await db.query.aiShowNote.findFirst({
		where: eq(aiShowNote.id, show_note_id),
		columns: { id: true }
	});

	if (!parent) {
		error(404, 'AI show note not found');
	}
}

// Helper function to sync Spotify data for specific shows
async function syncShowsSpotifyData(showNumbers: number[]): Promise<void> {
	const credentials: MegaphoneCredentials = {
		apiToken: MEGAPHONE_API_TOKEN as string,
		networkId: MEGAPHONE_NETWORK_ID as string,
		podcastId: MEGAPHONE_PODCAST_ID as string
	};

	for (const show_number of showNumbers) {
		try {
			await syncEpisodeSpotifyData(show_number, credentials);
		} catch (error) {
			console.error(`🎵 Failed to sync Spotify data for show ${show_number}:`, error);
		}
	}
}

export const get_all_shows = query(async () => {
	await assert_admin();

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

export const list_shows = query(list_shows_schema, async (input) =>
	show_editor.list_shows(await assert_admin(), input)
);

export const bulk_update_show_status = command(bulk_show_status_schema, async (input) => {
	await assert_admin();

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

export const get_show_editor = query(v.number(), async (show_number) =>
	show_editor.get_show_editor(await assert_admin(), show_number)
);

export const renumber_show = command(
	v.object({ show_number: v.number(), new_show_number: v.number() }),
	async ({ show_number, new_show_number }) =>
		show_editor.renumber_show(await assert_admin(), show_number, new_show_number)
);

export const create_show_editor = command(create_show_editor_schema, async (input) =>
	show_editor.create_show(await assert_admin(), input)
);

export const update_show_editor = command(update_show_editor_schema, async (input) =>
	show_editor.update_show(await assert_admin(), input)
);

export const sync_spotify_for_show = command(show_number_schema, async ({ show_number }) => {
	await assert_admin();

	if (!MEGAPHONE_API_TOKEN || !MEGAPHONE_NETWORK_ID || !MEGAPHONE_PODCAST_ID) {
		error(
			500,
			'Missing required Megaphone environment variables: MEGAPHONE_API_TOKEN, MEGAPHONE_NETWORK_ID, MEGAPHONE_PODCAST_ID'
		);
	}

	const credentials: MegaphoneCredentials = {
		apiToken: MEGAPHONE_API_TOKEN,
		networkId: MEGAPHONE_NETWORK_ID,
		podcastId: MEGAPHONE_PODCAST_ID
	};

	await syncEpisodeSpotifyData(show_number, credentials);

	return {
		success: true,
		message: 'Spotify sync completed successfully'
	};
});

export const search_guests = query(guest_search_schema, async ({ search_text }) => {
	await assert_admin();

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
	await assert_admin();

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
	await assert_admin();

	await db
		.delete(showGuest)
		.where(and(eq(showGuest.show_id, show_id), eq(showGuest.guest_id, guest_id)));

	return { success: true };
});

// ============================================================================
// HOST PANEL — search and attach Profiles to a Show
// ============================================================================

export const search_users_for_host = query(user_search_schema, async ({ search_text }) => {
	await assert_admin();

	const normalized_search = search_text?.trim() || '';

	const where_clause = normalized_search
		? or(
				ilike(profile.username, `%${normalized_search}%`),
				ilike(profile.name, `%${normalized_search}%`),
				ilike(profile.email, `%${normalized_search}%`)
			)
		: undefined;

	return db.query.profile.findMany({
		where: where_clause,
		columns: {
			id: true,
			username: true,
			name: true,
			email: true
		},
		orderBy: (profile_item, { asc }) => [asc(profile_item.username)],
		limit: 25
	});
});

export const add_show_host = command(show_host_schema, async ({ show_id, user_id }) => {
	await assert_admin();

	await db
		.insert(showToProfile)
		.values({
			show_id,
			profile_id: user_id
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_show_host = command(show_host_schema, async ({ show_id, user_id }) => {
	await assert_admin();

	await db
		.delete(showToProfile)
		.where(and(eq(showToProfile.show_id, show_id), eq(showToProfile.profile_id, user_id)));

	return { success: true };
});

// ============================================================================
// AI ARTIFACT EDITORIAL CRUD
// AI artifacts have no status column; regeneration replaces them wholesale.
// See docs/CONTEXT.md → "AI-generated content" and the lifecycle paragraph.
// ============================================================================

export const update_ai_show_note = command(update_ai_show_note_schema, async (input) => {
	await assert_admin();

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
	await assert_admin();

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
	await assert_admin();

	await db
		.update(aiTweet)
		.set({
			content: input.content
		})
		.where(eq(aiTweet.id, input.id));

	return { success: true };
});

export const update_link = command(update_link_schema, async (input) => {
	await assert_admin();

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
	await assert_admin();

	await db
		.update(aiGuest)
		.set({
			name: input.name
		})
		.where(eq(aiGuest.id, input.id));

	return { success: true };
});

export const update_topic = command(update_topic_schema, async (input) => {
	await assert_admin();

	await db
		.update(topic)
		.set({
			name: input.name
		})
		.where(eq(topic.id, input.id));

	return { success: true };
});

export const add_ai_summary_entry = command(add_ai_summary_entry_schema, async (input) => {
	await assert_admin();
	await assert_ai_show_note_exists(input.show_note_id);

	const [inserted] = await db
		.insert(aiSummaryEntry)
		.values({
			show_note_id: input.show_note_id,
			time: input.time,
			text: input.text,
			description: input.description ?? null
		})
		.returning();

	return inserted;
});

export const add_ai_tweet = command(add_ai_tweet_schema, async (input) => {
	await assert_admin();
	await assert_ai_show_note_exists(input.show_note_id);

	const [inserted] = await db
		.insert(aiTweet)
		.values({
			show_note_id: input.show_note_id,
			content: input.content
		})
		.returning();

	return inserted;
});

export const add_link = command(add_link_schema, async (input) => {
	await assert_admin();
	await assert_ai_show_note_exists(input.show_note_id);

	const [inserted] = await db
		.insert(link)
		.values({
			show_note_id: input.show_note_id,
			name: input.name,
			url: input.url,
			timestamp: input.timestamp ?? null
		})
		.returning();

	return inserted;
});

export const add_ai_guest = command(add_ai_guest_schema, async (input) => {
	await assert_admin();
	await assert_ai_show_note_exists(input.show_note_id);

	const [inserted] = await db
		.insert(aiGuest)
		.values({
			show_note_id: input.show_note_id,
			name: input.name
		})
		.returning();

	return inserted;
});

export const add_topic = command(add_topic_schema, async (input) => {
	await assert_admin();
	await assert_ai_show_note_exists(input.show_note_id);

	const [inserted] = await db
		.insert(topic)
		.values({
			show_note_id: input.show_note_id,
			name: input.name
		})
		.returning();

	return inserted;
});

export const delete_ai_summary_entry = command(ai_child_id_schema, async ({ id }) => {
	await assert_admin();

	await db.delete(aiSummaryEntry).where(eq(aiSummaryEntry.id, id));

	return { success: true };
});

export const delete_ai_tweet = command(ai_child_id_schema, async ({ id }) => {
	await assert_admin();

	await db.delete(aiTweet).where(eq(aiTweet.id, id));

	return { success: true };
});

export const delete_link = command(ai_child_id_schema, async ({ id }) => {
	await assert_admin();

	await db.delete(link).where(eq(link.id, id));

	return { success: true };
});

export const delete_ai_guest = command(ai_child_id_schema, async ({ id }) => {
	await assert_admin();

	await db.delete(aiGuest).where(eq(aiGuest.id, id));

	return { success: true };
});

export const delete_topic = command(ai_child_id_schema, async ({ id }) => {
	await assert_admin();

	await db.delete(topic).where(eq(topic.id, id));

	return { success: true };
});

export const import_all_shows = form(async () => {
	await assert_admin();

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
	await assert_admin();

	console.log('🤖 Pod Refresh Requested via Admin');
	const result = await import_or_update_all_shows();

	try {
		const credentials: MegaphoneCredentials = {
			apiToken: MEGAPHONE_API_TOKEN as string,
			networkId: MEGAPHONE_NETWORK_ID as string,
			podcastId: MEGAPHONE_PODCAST_ID as string
		};
		await syncAllEpisodesSpotifyData(credentials);
	} catch (error) {
		console.error('🎵 Spotify sync failed:', error);
	}

	return result;
});

export const delete_all_shows = form(async () => {
	await assert_admin();

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

// One episode's transcript: made by Grok from the audio, or deleted so it can be made again
export const transcribe_show = command(show_number_schema, async ({ show_number }) => {
	await assert_admin();

	await get_transcript(show_number);
	await get_show_editor(show_number).refresh();
	return { message: `Transcribed #${show_number}` };
});

export const regenerate_show_transcript = command(show_number_schema, async ({ show_number }) => {
	await assert_admin();

	await get_transcript(show_number, { replace: true });
	await get_show_editor(show_number).refresh();
	return { message: `Transcribed #${show_number} again` };
});

export const get_transcript_editor = query(
	v.object({
		show_number: v.number(),
		search_text: v.optional(v.string()),
		page: v.optional(v.number())
	}),
	async (input) => transcript_editor.get_transcript_editor(await assert_admin(), input)
);

export const rename_transcript_speaker = command(
	v.object({ transcript_id: v.string(), speaker: v.number(), speaker_name: v.string() }),
	async (input) => transcript_editor.rename_transcript_speaker(await assert_admin(), input)
);

export const update_transcript_line = command(
	v.object({ id: v.string(), text: v.string() }),
	async (input) => transcript_editor.update_transcript_line(await assert_admin(), input)
);

export const delete_show_transcript = command(show_number_schema, async ({ show_number }) => {
	await assert_admin();

	await db.delete(transcript).where(eq(transcript.show_number, show_number));
	await get_show_editor(show_number).refresh();
	return { message: `Deleted the transcript for #${show_number}` };
});

// fetch_ai_notes: aiNoteRequestHandler
export const fetch_ai_notes = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		await assert_admin();

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

		const result = await generate_ai_notes(current_show);

		await db.transaction(async (tx) => {
			await tx.delete(aiShowNote).where(eq(aiShowNote.show_number, show_number));

			const [inserted_show_note] = await tx
				.insert(aiShowNote)
				.values({
					show_number,
					title: result.title,
					description: result.description,
					provider: result.provider
				})
				.returning({ id: aiShowNote.id });

			if (result.summary.length > 0) {
				await tx.insert(aiSummaryEntry).values(
					result.summary.map((entry) => ({
						show_note_id: inserted_show_note.id,
						time: entry.time,
						text: entry.text,
						description: entry.description || null
					}))
				);
			}

			if (result.tweets.length > 0) {
				await tx.insert(aiTweet).values(
					result.tweets.map((tweet) => ({
						show_note_id: inserted_show_note.id,
						content: tweet
					}))
				);
			}

			if (result.links.length > 0) {
				await tx.insert(link).values(
					result.links.map((result_link) => ({
						show_note_id: inserted_show_note.id,
						name: result_link.name,
						url: result_link.url,
						timestamp: result_link.timestamp || null
					}))
				);
			}

			if (result.topics.length > 0) {
				await tx.insert(topic).values(
					result.topics.map((topic_name) => ({
						show_note_id: inserted_show_note.id,
						name: topic_name
					}))
				);
			}
		});

		return { message: 'AI Notes Created' };
	}
);
