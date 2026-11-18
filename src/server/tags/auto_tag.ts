import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';
import { OPENROUTER_API_KEY } from '$app/env/private';
import { db } from '$server/db/client';
import {
	content,
	content_tagging,
	content_tags,
	show,
	tag,
	transcript,
	transcriptUtterance
} from '$server/db/schema';
import {
	build_tag_request,
	build_tag_system_prompt,
	get_tag_slug,
	read_chat_message,
	read_tag_answer,
	TAG_MODEL,
	type TagAnswer,
	type TagInput,
	type TagTopic
} from './tag_prompt';

// The tag engine: one Sonnet 5.5 call per episode or video picks its topics (from the curated TOPIC
// tags) and names its libraries (LIBRARY tags, made as needed). Runs from /webhooks/tags.

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
// The tags table's name column
const MAX_TAG_NAME_LENGTH = 50;

export class TagEngineNotReadyError extends Error {}

type TagContext = { system_prompt: string; topics: TagTopic[] };

/** The topic list and existing names, read once per run: the prompt is the same for every item. */
export async function load_tag_context(): Promise<TagContext> {
	const rows = await db
		.select({ slug: tag.slug, name: tag.name, kind: tag.kind, description: tag.description })
		.from(tag)
		.orderBy(asc(tag.name));
	const topics = rows.flatMap((row) =>
		row.kind === 'TOPIC' && row.slug
			? [{ slug: row.slug, name: row.name, description: row.description }]
			: []
	);
	if (topics.length === 0) throw new TagEngineNotReadyError('There are no TOPIC tags to tag with');
	// Legacy tags count too, so "Nuxt" keeps its old tag (and URL) when it becomes a library
	const library_names = rows.flatMap((row) => (row.kind === 'TOPIC' ? [] : [row.name]));
	return { system_prompt: build_tag_system_prompt(topics, library_names), topics };
}

// Has a transcript with words in it. Videos without captions get an empty one.
const has_transcript = sql<boolean>`exists (
	select 1 from ${transcript}
	join ${transcriptUtterance} on ${transcriptUtterance.transcript_id} = ${transcript.id}
	left join ${show} on ${show.number} = ${transcript.show_number}
	where ${transcript.content_id} = ${content.id} or ${show.content_id} = ${content.id}
)`;

/**
 * Published episodes and videos that need tags, newest first: never tagged, or tagged before their
 * transcript arrived.
 */
export async function find_content_needing_tags(limit: number): Promise<string[]> {
	const rows = await db
		.select({ id: content.id })
		.from(content)
		.leftJoin(content_tagging, eq(content_tagging.content_id, content.id))
		.where(
			and(
				eq(content.status, 'PUBLISHED'),
				or(eq(content.type, 'PODCAST'), eq(content.type, 'VIDEO')),
				sql`${content.published_at} <= now()`,
				or(
					isNull(content_tagging.content_id),
					and(eq(content_tagging.from_transcript, false), has_transcript)
				)
			)
		)
		.orderBy(sql`${content.published_at} desc`)
		.limit(limit);
	return rows.map((row) => row.id);
}

/** What the model reads about one episode or video. Null when it isn't one. */
export async function load_tag_input(content_id: string): Promise<TagInput | null> {
	const row = await db.query.content.findFirst({
		where: eq(content.id, content_id),
		columns: { title: true, type: true },
		with: {
			show: { columns: { number: true, title: true, show_notes: true } },
			video: { columns: { description: true } },
			transcript: { columns: { id: true } }
		}
	});
	if (!row) return null;

	let transcript_id: string | null = row.transcript?.id ?? null;
	if (row.show && !transcript_id) {
		const episode_transcript = await db.query.transcript.findFirst({
			where: eq(transcript.show_number, row.show.number),
			columns: { id: true }
		});
		transcript_id = episode_transcript?.id ?? null;
	}
	const utterances = transcript_id
		? await db
				.select({ text: transcriptUtterance.transcript_value })
				.from(transcriptUtterance)
				.where(eq(transcriptUtterance.transcript_id, transcript_id))
				.orderBy(asc(transcriptUtterance.start))
		: [];

	if (row.type === 'PODCAST' && row.show) {
		return {
			kind: 'episode',
			title: row.show.title,
			description: row.show.show_notes ?? '',
			transcript: utterances.map((utterance) => utterance.text).join(' ')
		};
	}
	if (row.type === 'VIDEO' && row.video) {
		return {
			kind: 'video',
			title: row.title,
			description: row.video.description ?? '',
			transcript: utterances.map((utterance) => utterance.text).join(' ')
		};
	}
	return null;
}

/** Asks the model for one item's tags. */
export async function request_tags(context: TagContext, input: TagInput): Promise<TagAnswer> {
	if (!OPENROUTER_API_KEY) throw new TagEngineNotReadyError('OPENROUTER_API_KEY is not set');
	const body = build_tag_request(
		context.system_prompt,
		context.topics.map((topic) => topic.slug),
		input
	);
	const response = await fetch(OPENROUTER_CHAT_URL, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 500)}`);

	const message_content = read_chat_message(JSON.parse(text));
	if (message_content === null) {
		throw new Error(`OpenRouter answer has no message: ${text.slice(0, 500)}`);
	}
	return read_tag_answer(message_content, context.topics);
}

// A library's tag: the existing tag with that name or slug (a legacy one becomes a LIBRARY), or a new
// one. Null when the name belongs to a topic.
async function find_or_create_library_tag(name: string): Promise<string | null> {
	const slug = get_tag_slug(name);
	const existing = await db.query.tag.findFirst({
		where: or(sql`lower(${tag.name}) = lower(${name})`, eq(tag.slug, slug)),
		columns: { id: true, kind: true }
	});
	if (existing) {
		if (existing.kind === 'TOPIC') return null;
		if (existing.kind === null) {
			await db.update(tag).set({ kind: 'LIBRARY' }).where(eq(tag.id, existing.id));
		}
		return existing.id;
	}
	const [created] = await db
		.insert(tag)
		.values({ name: name.slice(0, MAX_TAG_NAME_LENGTH), slug, kind: 'LIBRARY' })
		.onConflictDoNothing()
		.returning({ id: tag.id });
	if (created) return created.id;
	// Another run made it a moment ago
	const raced = await db.query.tag.findFirst({ where: eq(tag.slug, slug), columns: { id: true } });
	return raced?.id ?? null;
}

/**
 * Writes one item's tags: its AI tags are replaced, an editor's are kept, and it's marked tagged.
 */
export async function save_tags(content_id: string, answer: TagAnswer, from_transcript: boolean) {
	const topic_rows = answer.topic_slugs.length
		? await db.query.tag.findMany({
				where: (t, { and, eq, inArray }) =>
					and(eq(t.kind, 'TOPIC'), inArray(t.slug, answer.topic_slugs)),
				columns: { id: true }
			})
		: [];
	const library_ids: string[] = [];
	for (const name of answer.libraries) {
		const tag_id = await find_or_create_library_tag(name);
		if (tag_id) library_ids.push(tag_id);
	}
	const tag_ids = [...new Set([...topic_rows.map((row) => row.id), ...library_ids])];

	await db.transaction(async (tx) => {
		await tx
			.delete(content_tags)
			.where(and(eq(content_tags.content_id, content_id), eq(content_tags.source, 'AI')));
		if (tag_ids.length) {
			await tx
				.insert(content_tags)
				.values(tag_ids.map((tag_id) => ({ content_id, tag_id, source: 'AI' as const })))
				.onConflictDoNothing();
		}
		await tx
			.insert(content_tagging)
			.values({ content_id, model: TAG_MODEL, from_transcript, tagged_at: new Date() })
			.onConflictDoUpdate({
				target: content_tagging.content_id,
				set: { model: TAG_MODEL, from_transcript, tagged_at: new Date() }
			});
	});
	return tag_ids.length;
}

export type TagRunResult = { tagged: number; failed: number };

/**
 * Tags up to `limit` items that need it. One item failing doesn't stop the rest.
 */
export async function tag_next_content(limit: number): Promise<TagRunResult> {
	const content_ids = await find_content_needing_tags(limit);
	if (content_ids.length === 0) return { tagged: 0, failed: 0 };

	const context = await load_tag_context();
	let tagged = 0;
	let failed = 0;
	for (const content_id of content_ids) {
		try {
			const input = await load_tag_input(content_id);
			if (!input) continue;
			const answer = await request_tags(context, input);
			const count = await save_tags(content_id, answer, input.transcript.length > 0);
			console.log(`Tagged ${input.kind} "${input.title}" with ${count} tags`, answer);
			tagged++;
		} catch (error) {
			if (error instanceof TagEngineNotReadyError) throw error;
			console.error(`Couldn't tag content ${content_id}`, error);
			failed++;
		}
	}
	return { tagged, failed };
}
