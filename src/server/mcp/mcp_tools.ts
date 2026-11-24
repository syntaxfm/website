import { error, isHttpError } from '@sveltejs/kit';
import * as Exit from 'effect/Exit';
import * as Schema from 'effect/Schema';

import * as dashboard from '$server/admin/dashboard';
import * as articles from '$server/articles/articles';
import { is_admin, type Actor } from '$server/auth/authorization';
import * as content_library from '$server/content/content';
import {
	content_status,
	content_types,
	SUBMISSION_STATUS_VALUES,
	SUBMISSION_TYPE_VALUES
} from '$server/db/schema';
import * as guests from '$server/guests/guests';
import * as seo_queries from '$server/seo_tracker/seo_queries';
import * as show_editor from '$server/shows/show_editor';
import * as submissions from '$server/submissions/submissions';
import * as tags from '$server/tags/tags';
import * as videos from '$server/video/videos';

import {
	project_content_detail,
	project_content_summary,
	project_guest,
	project_guest_detail,
	project_show_detail,
	project_show_summary,
	project_tagged_content_summary
} from './mcp_projections';

// The MCP endpoint's tools. Each one calls the same server function as the admin page that does
// the same thing (src/server/**), with the person the access token stands for as the actor, so
// the rules live in one place. Anyone signed in can read what the site publishes; admins also see
// drafts and scheduled content, admin-only data, and the writes. Nothing here deletes anything or
// edits Users or roles.

/** Who may call a tool: anyone signed in with Syntax Auth, or only a Profile with the admin role. */
export type McpToolAccess = 'signed_in' | 'admin';

/** A tool's answer: its JSON result, or a refusal or failure with isError. */
export interface McpToolAnswer {
	is_error: boolean;
	result: Schema.JsonObject;
}

export interface McpTool {
	name: string;
	description: string;
	access: McpToolAccess;
	is_read_only: boolean;
	is_idempotent: boolean;
	// The tool's arguments as JSON Schema (draft 2020-12): every property described, no others allowed
	input_schema: { [key: string]: unknown };
	call: (actor: Actor, tool_arguments: unknown) => Promise<McpToolAnswer>;
}

const ADMIN_ACCESS_REQUIRED =
	'Admin access required: your Syntax account doesn’t have the admin role. Nothing was changed.';

const to_json = Schema.decodeUnknownSync(Schema.Json);

function failure_answer(status: number, message: string): McpToolAnswer {
	return { is_error: true, result: { error: { status, message } } };
}

function is_json_object(json: Schema.Json): json is Schema.JsonObject {
	return typeof json === 'object' && json !== null && !Array.isArray(json);
}

// Dates become ISO text, as JSON.stringify writes them; a result that isn't an object is wrapped
function success_answer(output: unknown): McpToolAnswer {
	const json = to_json(JSON.parse(JSON.stringify(output ?? null)));
	return { is_error: false, result: is_json_object(json) ? json : { result: json } };
}

interface McpToolDefinition<Input, Encoded> {
	name: string;
	description: string;
	access: McpToolAccess;
	is_read_only: boolean;
	is_idempotent: boolean;
	input: Schema.Codec<Input, Encoded>;
	run: (actor: Actor, input: Input) => Promise<unknown>;
}

/**
 * A tool from its definition. A call checks access first, then decodes the arguments (a bad one is
 * an isError answer the agent can correct), then runs. kit's error() from a server function comes
 * back as an isError answer with its status and message; anything else is thrown, for the server
 * to log.
 */
function define_tool<Input, Encoded>(definition: McpToolDefinition<Input, Encoded>): McpTool {
	const decode_arguments = Schema.decodeUnknownExit(definition.input, {
		errors: 'all',
		onExcessProperty: 'error'
	});
	const { schema, definitions } = Schema.toJsonSchemaDocument(definition.input, {
		onExcessProperty: 'error'
	});

	return {
		name: definition.name,
		description: definition.description,
		access: definition.access,
		is_read_only: definition.is_read_only,
		is_idempotent: definition.is_idempotent,
		input_schema:
			Object.keys(definitions).length === 0 ? schema : { ...schema, $defs: definitions },
		call: async (actor, tool_arguments) => {
			if (definition.access === 'admin' && !is_admin(actor)) {
				return failure_answer(403, ADMIN_ACCESS_REQUIRED);
			}

			const decoded = decode_arguments(tool_arguments ?? {});
			if (Exit.isFailure(decoded)) {
				const issues = decoded.cause.reasons.map((reason) =>
					reason._tag === 'Fail' ? reason.error.message : 'Invalid arguments'
				);
				return failure_answer(400, issues.join('\n'));
			}

			try {
				return success_answer(await definition.run(actor, decoded.value));
			} catch (run_error) {
				if (isHttpError(run_error)) {
					return failure_answer(run_error.status, run_error.body.message);
				}
				throw run_error;
			}
		}
	};
}

// Input pieces
// ======================================================

const id_input = (description: string) =>
	Schema.String.check(Schema.isUUID()).annotate({ description });

// Text that must be there: not empty, and without leading or trailing spaces
const text_input = (description: string) =>
	Schema.String.check(Schema.isTrimmed(), Schema.isMinLength(1)).annotate({ description });

const page_inputs = {
	page: Schema.optionalKey(
		Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)).annotate({
			description: 'Page number, from 1. Defaults to 1.'
		})
	),
	page_size: Schema.optionalKey(
		Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 50 })).annotate({
			description: 'Results per page, 1 to 50. Defaults to 25.'
		})
	)
};

const search_text_input = Schema.optionalKey(
	Schema.String.annotate({ description: 'Text to find, case-insensitive.' })
);

const date_range_inputs = {
	date_from: Schema.optionalKey(
		Schema.String.annotate({
			description: 'Only items dated on or after this ISO 8601 date or date-time.'
		})
	),
	date_to: Schema.optionalKey(
		Schema.String.annotate({
			description: 'Only items dated on or before this ISO 8601 date or date-time.'
		})
	)
};

const order_input = Schema.optionalKey(
	Schema.Literals(['asc', 'desc']).annotate({
		description: 'Date order: desc (newest first, the default) or asc.'
	})
);

const content_status_input = (description: string) =>
	Schema.Literals(content_status.enumValues).annotate({ description });

const status_filter_input = Schema.optionalKey(
	Schema.Literals([...content_status.enumValues, 'ALL']).annotate({
		description:
			'Admins: only this status (DRAFT, PUBLISHED or ARCHIVED), or ALL (the default). Everyone else always gets released content only.'
	})
);

const published_at_input = Schema.optionalKey(
	Schema.NullOr(Schema.String).annotate({
		description:
			'Release date-time, ISO 8601. A future date with status PUBLISHED schedules it. Null clears it; publishing without a date publishes now. Left out, it stays as it is.'
	})
);

const tag_ids_input = (description: string) =>
	Schema.Array(id_input('A tag ID (search_tags).')).check(Schema.isMaxLength(50)).annotate({
		description
	});

const content_ids_input = Schema.Array(id_input('A content ID (search_content).'))
	.check(Schema.isMinLength(1), Schema.isMaxLength(100))
	.annotate({ description: 'The content items, 1 to 100.' });

const show_number_input = (description: string) =>
	Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).annotate({ description });

// An episode, named by its content ID or by its number (a draft may have no number yet)
const show_key_inputs = {
	content_id: Schema.optionalKey(
		id_input("The Show's content ID (from create_show or search_shows).")
	),
	show_number: Schema.optionalKey(show_number_input('The episode number.'))
};

function to_show_key(input: { content_id?: string; show_number?: number }): show_editor.ShowKey {
	if (input.content_id !== undefined && input.show_number !== undefined) {
		error(400, 'Give content_id or show_number, not both');
	}
	if (input.content_id !== undefined) return { content_id: input.content_id };
	if (input.show_number !== undefined) return { show_number: input.show_number };
	error(400, 'Give content_id or show_number');
}

// A tool without arguments: an empty object (Schema.Struct({}) would accept any value)
const no_input = Schema.Record(
	Schema.String,
	Schema.Never.annotate({ message: 'Expected no excess property' })
);

// Tools
// ======================================================

const search_shows = define_tool({
	name: 'search_shows',
	description:
		'Search Syntax podcast episodes (Shows) by title, newest number first. Admins also see drafts, scheduled and archived Shows.',
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		search_text: search_text_input,
		status: status_filter_input,
		...date_range_inputs,
		...page_inputs
	}),
	run: async (actor, input) => {
		const result = await show_editor.list_shows(actor, {
			search_text: input.search_text,
			status: input.status,
			date_from_iso: input.date_from,
			date_to_iso: input.date_to,
			page: input.page,
			page_size: input.page_size
		});
		return { ...result, items: result.items.map(project_show_summary) };
	}
});

const get_show = define_tool({
	name: 'get_show',
	description:
		'One Show by its content ID or its number: show notes, tags, guests, hosts, and its AI notes (summary, links, topics, tweets). Admins also see unreleased Shows, including drafts without a number.',
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct(show_key_inputs),
	run: async (actor, input) => {
		const found = await show_editor.get_show(actor, to_show_key(input));
		if (!found) error(404, 'Show not found');
		return project_show_detail(found);
	}
});

const search_videos = define_tool({
	name: 'search_videos',
	description:
		"Search Syntax's YouTube videos by title, by release date. Admins also see drafts and archived videos.",
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		search_text: search_text_input,
		status: status_filter_input,
		...date_range_inputs,
		order: order_input,
		...page_inputs
	}),
	run: (actor, input) =>
		videos.list_videos(actor, {
			search_text: input.search_text,
			status: input.status,
			date_from_iso: input.date_from,
			date_to_iso: input.date_to,
			order: input.order,
			page: input.page,
			page_size: input.page_size
		})
});

const search_content = define_tool({
	name: 'search_content',
	description:
		'Search all content (Shows, videos, articles and other types) by title, optionally of one type or with one tag, newest first. Admins also see drafts, scheduled and archived items.',
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		search_text: search_text_input,
		type: Schema.optionalKey(
			Schema.Literals([...content_types.enumValues, 'ALL']).annotate({
				description: 'Only this content type (PODCAST is a Show), or ALL (the default).'
			})
		),
		status: status_filter_input,
		tag_id: Schema.optionalKey(id_input('Only content with this tag (search_tags).')),
		...date_range_inputs,
		...page_inputs
	}),
	run: async (actor, input) => {
		const result = await content_library.list_content(actor, {
			search_text: input.search_text,
			type: input.type,
			status: input.status,
			tag_id: input.tag_id,
			date_from_iso: input.date_from,
			date_to_iso: input.date_to,
			page: input.page,
			page_size: input.page_size
		});
		return { ...result, items: result.items.map(project_tagged_content_summary) };
	}
});

const get_content = define_tool({
	name: 'get_content',
	description:
		"One content item by ID with its tags and its type's details: a video's YouTube data, an article's body and author, a Show's links (get_show has the rest).",
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({ content_id: id_input('The content ID (search_content).') }),
	run: async (actor, { content_id }) => {
		const found = await content_library.get_content_detail(actor, content_id);
		if (!found) error(404, 'Content not found');
		return project_content_detail(found);
	}
});

const search_guests = define_tool({
	name: 'search_guests',
	description: 'Search the guests interviewed on Syntax by name, alphabetically.',
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({ search_text: search_text_input, ...page_inputs }),
	run: async (actor, input) => {
		const result = await guests.list_guests(actor, input);
		return { ...result, items: result.items.map(project_guest) };
	}
});

const get_guest = define_tool({
	name: 'get_guest',
	description:
		'One guest by ID: their links and the Shows they were on, newest first. Admins also see unreleased Shows.',
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({ guest_id: id_input('The guest ID (search_guests).') }),
	run: async (actor, { guest_id }) => {
		const found = await guests.get_guest_detail(actor, guest_id);
		if (!found) error(404, 'Guest not found');
		return project_guest_detail(found);
	}
});

const search_tags = define_tool({
	name: 'search_tags',
	description:
		"Search the site's tags (curated topics) by name or slug, with how much content uses each.",
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({ search_text: search_text_input, ...page_inputs }),
	run: (actor, input) => tags.list_tags(actor, input)
});

const get_tag = define_tool({
	name: 'get_tag',
	description:
		'One tag by ID and its 100 most recently updated content items. Admins also see unreleased content.',
	access: 'signed_in',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({ tag_id: id_input('The tag ID (search_tags).') }),
	run: async (actor, { tag_id }) => {
		const result = await tags.get_tag_detail(actor, tag_id);
		return { ...result, items: result.items.map(project_content_summary) };
	}
});

const get_admin_dashboard = define_tool({
	name: 'get_admin_dashboard',
	description:
		'Admin only. The admin home summary: pending submission counts, drafts, scheduled and recently published content, stale drafts, Shows missing transcripts or AI notes, and recent activity.',
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: no_input,
	run: (actor) => dashboard.get_admin_dashboard(actor)
});

const search_submissions = define_tool({
	name: 'search_submissions',
	description:
		'Admin only. Search audience submissions (questions, pitches, feedback) by name, email or text. Use status PENDING for the ones waiting for review.',
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		search_text: search_text_input,
		status: Schema.optionalKey(
			Schema.Literals(SUBMISSION_STATUS_VALUES.enumValues).annotate({
				description: 'Only this status. Left out, every status.'
			})
		),
		submission_type: Schema.optionalKey(
			Schema.Literals(SUBMISSION_TYPE_VALUES.enumValues).annotate({
				description: 'Only submissions from this form. Left out, every form.'
			})
		),
		...date_range_inputs,
		order: order_input,
		...page_inputs
	}),
	run: (actor, input) =>
		submissions.list_submissions(actor, {
			search_text: input.search_text,
			status: input.status,
			submission_type: input.submission_type,
			date_from_iso: input.date_from,
			date_to_iso: input.date_to,
			order: input.order,
			page: input.page,
			page_size: input.page_size
		})
});

// SEO: read-only views of the stored snapshots (seo_queries.ts), small enough for one question.
// None takes a new snapshot or calls a paid API.

const get_seo_overview = define_tool({
	name: 'get_seo_overview',
	description:
		"Admin only. Start here for how syntax.fm does in search overall: the latest SEO snapshot's Google keyword totals and position bands, estimated traffic, backlinks, top competing domains, niche visibility, and the change since the snapshot before. No keyword lists; see search_seo_keywords.",
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: no_input,
	run: (actor) => seo_queries.get_seo_overview(actor)
});

const list_seo_searches = define_tool({
	name: 'list_seo_searches',
	description:
		"Admin only. Start here for a topic: every tracked search (such as 'ai engineering') in one row: Syntax's Google and YouTube positions, its Spotify show and best episode positions (logged-out Spotify search: top 10 shows, top 30 episodes), their change since the previous snapshot (positive = moved up), monthly Google searches, difficulty, and Syntax's ranking page, video or episode. Then use get_seo_search for one in depth.",
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: no_input,
	run: (actor) => seo_queries.list_seo_searches(actor)
});

const get_seo_search = define_tool({
	name: 'get_seo_search',
	description:
		"Admin only. One tracked search in depth, to see who outranks Syntax and why: Syntax's position over recent snapshots, and the latest top 10 results (YouTube: title, channel, views, length, age, description; Google: title, site, URL, description; Spotify: the top 10 shows and top 10 episodes with show, date, length, description), Google's result types, and monthly demand. Snapshots before 2026-11-18 have only the top 3 names (results_detail_available: false); before 2026-11-20 there is no Spotify.",
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		search: text_input('The tracked search, exactly as list_seo_searches names it.'),
		platform: Schema.optionalKey(
			Schema.Literals(['google', 'youtube', 'spotify', 'all']).annotate({
				description: 'Which results: google, youtube, spotify, or all (the default).'
			})
		),
		history_limit: Schema.optionalKey(
			Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 20 })).annotate({
				description: 'How many snapshots of position history, 1 to 20. Defaults to 8.'
			})
		)
	}),
	run: (actor, input) =>
		seo_queries.get_seo_search(actor, {
			search: input.search,
			platform: input.platform ?? 'all',
			history_limit: input.history_limit ?? 8
		})
});

const search_seo_keywords = define_tool({
	name: 'search_seo_keywords',
	description:
		"Admin only. The Google keywords syntax.fm ranks for in the latest snapshot (up to its top 100), filtered and sorted: each with monthly searches, position, ranking URL, difficulty, intent, and whether Google shows an AI overview. On-topic only by default (Syntax's tags and guests).",
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		query: Schema.optionalKey(
			Schema.String.annotate({ description: 'Only keywords containing this text.' })
		),
		min_volume: Schema.optionalKey(
			Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).annotate({
				description: 'Only keywords with at least this many monthly searches.'
			})
		),
		position_min: Schema.optionalKey(
			Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })).annotate({
				description: 'Only keywords where syntax.fm is at this Google position or lower.'
			})
		),
		position_max: Schema.optionalKey(
			Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })).annotate({
				description: 'Only keywords where syntax.fm is at this Google position or higher.'
			})
		),
		on_topic_only: Schema.optionalKey(
			Schema.Boolean.annotate({
				description:
					"Only keywords about Syntax's topics or guests (true, the default); false includes everything, such as song lyrics the homepage ranks for."
			})
		),
		sort: Schema.optionalKey(
			Schema.Literals(['volume', 'position', 'difficulty']).annotate({
				description:
					'volume (most searched first, the default), position (best first), or difficulty (easiest first).'
			})
		),
		limit: Schema.optionalKey(
			Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })).annotate({
				description: 'Keywords to return, 1 to 100. Defaults to 25.'
			})
		),
		offset: Schema.optionalKey(
			Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).annotate({
				description: 'Matches to skip, for the next page. Defaults to 0.'
			})
		)
	}),
	run: (actor, input) => seo_queries.search_seo_keywords(actor, input)
});

const list_seo_opportunities = define_tool({
	name: 'list_seo_opportunities',
	description:
		'Admin only. On-topic Google keywords where syntax.fm is close to the top (positions 4 to 30, at least 20 monthly searches), most searched first: where a better page or title helps most.',
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({
		limit: Schema.optionalKey(
			Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 50 })).annotate({
				description: 'Keywords to return, 1 to 50. Defaults to 20.'
			})
		)
	}),
	run: (actor, input) => seo_queries.list_seo_opportunities(actor, input.limit ?? 20)
});

const create_show = define_tool({
	name: 'create_show',
	description:
		'Admin only. Creates a Show and its content, and answers with its content_id. A DRAFT may leave out show_number and url (the audio) until they are known; PUBLISHED (with a future published_at it is scheduled) needs both. Add hosts, guests and tags with update_show.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: false,
	input: Schema.Struct({
		show_number: Schema.optionalKey(
			Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))).annotate({
				description:
					'The new episode number; must not exist yet. Null or left out for a draft without one.'
			})
		),
		title: text_input('The episode title.'),
		slug: text_input('The URL slug, unique across all content.'),
		status: content_status_input('DRAFT, PUBLISHED or ARCHIVED.'),
		published_at: published_at_input,
		show_notes: Schema.String.annotate({ description: 'The show notes, Markdown.' }),
		url: Schema.optionalKey(
			Schema.NullOr(Schema.String).annotate({
				description: 'The episode audio URL. Null or left out for a draft without audio yet.'
			})
		),
		youtube_url: Schema.optionalKey(
			Schema.NullOr(Schema.String).annotate({ description: 'The YouTube URL, if any.' })
		)
	}),
	run: (actor, input) =>
		show_editor.create_show(actor, {
			show_number: input.show_number ?? null,
			title: input.title,
			slug: input.slug,
			status: input.status,
			published_at_iso: input.published_at,
			show_notes: input.show_notes,
			url: input.url ?? null,
			youtube_url: input.youtube_url
		})
});

const update_show = define_tool({
	name: 'update_show',
	description:
		'Admin only. Changes a Show, named by content_id or show_number: only the fields you give change. new_show_number sets its number (null clears it on a draft). Publish with status PUBLISHED (now, or at a future published_at to schedule); that needs a number and an audio url. host_ids, guest_ids and tag_ids replace the whole list.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		...show_key_inputs,
		new_show_number: Schema.optionalKey(
			Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))).annotate({
				description: 'A new episode number; must not exist yet. Null clears it (drafts only).'
			})
		),
		title: Schema.optionalKey(text_input('The episode title.')),
		slug: Schema.optionalKey(text_input('The URL slug, unique across all content.')),
		status: Schema.optionalKey(content_status_input('DRAFT, PUBLISHED or ARCHIVED.')),
		published_at: published_at_input,
		show_notes: Schema.optionalKey(
			Schema.String.annotate({ description: 'The show notes, Markdown.' })
		),
		url: Schema.optionalKey(
			Schema.NullOr(Schema.String).annotate({
				description: 'The episode audio URL; null removes it (drafts only).'
			})
		),
		youtube_url: Schema.optionalKey(
			Schema.NullOr(Schema.String).annotate({ description: 'The YouTube URL; null removes it.' })
		),
		host_ids: Schema.optionalKey(
			Schema.Array(id_input('A host profile ID (search_hosts).'))
				.check(Schema.isMaxLength(10))
				.annotate({ description: "The Show's hosts; replaces the list. [] removes them all." })
		),
		guest_ids: Schema.optionalKey(
			Schema.Array(id_input('A guest ID (search_guests).'))
				.check(Schema.isMaxLength(20))
				.annotate({ description: "The Show's guests; replaces the list. [] removes them all." })
		),
		tag_ids: Schema.optionalKey(
			tag_ids_input("The Show's tags; replaces the list. [] removes them all.")
		)
	}),
	run: async (actor, input) => {
		const content_id = await show_editor.get_show_content_id(to_show_key(input));
		const existing = await show_editor.get_show_editor(actor, content_id);
		if (!existing) error(404, 'Show not found');

		// The number first, so a Show given its number can be published in the same call
		if (input.new_show_number !== undefined) {
			await show_editor.set_show_number(actor, content_id, input.new_show_number);
		}

		await show_editor.update_show(actor, {
			content_id,
			title: input.title ?? existing.title,
			slug: input.slug ?? existing.slug,
			status: input.status ?? existing.meta?.status ?? 'DRAFT',
			published_at_iso:
				input.published_at !== undefined
					? input.published_at
					: (existing.meta?.published_at?.toISOString() ?? null),
			show_notes: input.show_notes ?? existing.show_notes,
			url: input.url !== undefined ? input.url : existing.url,
			youtube_url: input.youtube_url !== undefined ? input.youtube_url : existing.youtube_url,
			host_ids: input.host_ids ? [...input.host_ids] : undefined,
			guest_ids: input.guest_ids ? [...input.guest_ids] : undefined,
			tag_ids: input.tag_ids ? [...input.tag_ids] : undefined
		});
		return { success: true, content_id };
	}
});

const search_hosts = define_tool({
	name: 'search_hosts',
	description:
		'Admin only. People who can host a Show (Syntax profiles), by username or name, 25 at most. Their IDs go in update_show host_ids.',
	access: 'admin',
	is_read_only: true,
	is_idempotent: true,
	input: Schema.Struct({ search_text: search_text_input }),
	run: async (actor, input) =>
		(await show_editor.search_hosts(actor, input.search_text)).map(({ id, username, name }) => ({
			id,
			username,
			name
		}))
});

const update_video = define_tool({
	name: 'update_video',
	description:
		"Admin only. Changes whether a video is on the site (status) and, when tag_ids is given, replaces its tags. YouTube owns a video's title, description and date. Archive a video to take it off the site.",
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		content_id: id_input("The video's content ID (search_videos)."),
		status: Schema.optionalKey(
			content_status_input('DRAFT, PUBLISHED or ARCHIVED. Left out, it stays as it is.')
		),
		tag_ids: Schema.optionalKey(
			tag_ids_input("The video's tags; replaces the list. [] removes them all.")
		)
	}),
	run: async (actor, input) => {
		const existing = await content_library.get_content_detail(actor, input.content_id);
		if (!existing || existing.type !== 'VIDEO') error(404, 'Video not found');

		return videos.update_video_meta(actor, {
			content_id: input.content_id,
			status: input.status ?? existing.status,
			tag_ids: input.tag_ids ? [...input.tag_ids] : undefined
		});
	}
});

const create_article = define_tool({
	name: 'create_article',
	description:
		'Admin only. Creates an empty draft article written by you. Fill it in with update_article.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: false,
	input: Schema.Struct({
		title: text_input('The article title.'),
		slug: Schema.optionalKey(
			Schema.String.annotate({ description: 'The URL slug. Left out, it comes from the title.' })
		)
	}),
	run: (actor, input) => articles.create_article(actor, input)
});

const update_article = define_tool({
	name: 'update_article',
	description:
		'Admin only. Changes an article: only the fields you give change. Publish with status PUBLISHED (now, or at a future published_at to schedule). tag_ids replaces the whole list.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		content_id: id_input("The article's content ID (search_content)."),
		title: Schema.optionalKey(text_input('The article title.')),
		slug: Schema.optionalKey(text_input('The URL slug, unique across all content.')),
		status: Schema.optionalKey(content_status_input('DRAFT, PUBLISHED or ARCHIVED.')),
		published_at: published_at_input,
		body: Schema.optionalKey(
			Schema.String.annotate({ description: 'The article body, Markdown.' })
		),
		author_id: Schema.optionalKey(id_input("The author's Profile ID.")),
		tag_ids: Schema.optionalKey(
			tag_ids_input("The article's tags; replaces the list. [] removes them all.")
		)
	}),
	run: async (actor, input) => {
		const existing = await content_library.get_content_detail(actor, input.content_id);
		if (!existing?.article) error(404, 'Article not found');

		return articles.update_article(actor, {
			content_id: input.content_id,
			title: input.title ?? existing.title,
			slug: input.slug ?? existing.slug,
			status: input.status ?? existing.status,
			published_at_iso:
				input.published_at !== undefined
					? input.published_at
					: (existing.published_at?.toISOString() ?? null),
			body: input.body ?? existing.article.body,
			author_id: input.author_id ?? existing.article.author_id,
			tag_ids: input.tag_ids ? [...input.tag_ids] : undefined
		});
	}
});

const set_content_status = define_tool({
	name: 'set_content_status',
	description:
		'Admin only. Sets the status of several content items at once. PUBLISHED keeps each item’s date (or publishes it now); DRAFT clears the date; ARCHIVED takes it off the site. To schedule, use update_show or update_article with a future published_at.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		content_ids: content_ids_input,
		status: content_status_input('DRAFT, PUBLISHED or ARCHIVED.')
	}),
	run: (actor, input) =>
		content_library.bulk_update_status(actor, {
			content_ids: [...input.content_ids],
			status: input.status
		})
});

const content_tags_input = Schema.Struct({
	content_ids: content_ids_input,
	tag_ids: tag_ids_input('The tags, 1 to 50.').check(Schema.isMinLength(1))
});

const add_content_tags = define_tool({
	name: 'add_content_tags',
	description: 'Admin only. Adds every given tag to every given content item. Existing tags stay.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: content_tags_input,
	run: (actor, input) =>
		content_library.assign_content_tags(actor, {
			content_ids: [...input.content_ids],
			tag_ids: [...input.tag_ids]
		})
});

const remove_content_tags = define_tool({
	name: 'remove_content_tags',
	description:
		'Admin only. Takes every given tag off every given content item. The tags themselves stay.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: content_tags_input,
	run: (actor, input) =>
		content_library.remove_content_tags(actor, {
			content_ids: [...input.content_ids],
			tag_ids: [...input.tag_ids]
		})
});

const create_tag = define_tool({
	name: 'create_tag',
	description: 'Admin only. Creates a tag.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: false,
	input: Schema.Struct({
		name: text_input('The tag name, up to 50 characters.').check(Schema.isMaxLength(50)),
		slug: Schema.optionalKey(
			Schema.String.annotate({ description: 'The URL slug. Left out, it comes from the name.' })
		)
	}),
	run: (actor, input) => tags.create_tag(actor, input)
});

const update_tag = define_tool({
	name: 'update_tag',
	description: 'Admin only. Renames a tag and sets its slug (from the name when left out).',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		tag_id: id_input('The tag ID (search_tags).'),
		name: text_input('The tag name, up to 50 characters.').check(Schema.isMaxLength(50)),
		slug: Schema.optionalKey(
			Schema.String.annotate({ description: 'The URL slug. Left out, it comes from the name.' })
		)
	}),
	run: (actor, { tag_id, name, slug }) => tags.update_tag(actor, { id: tag_id, name, slug })
});

const create_guest = define_tool({
	name: 'create_guest',
	description: 'Admin only. Creates a guest. Add their details with update_guest.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: false,
	input: Schema.Struct({ name: text_input("The guest's name.") }),
	run: (actor, input) => guests.create_guest(actor, input)
});

const optional_guest_link = (description: string) =>
	Schema.optionalKey(Schema.NullOr(Schema.String).annotate({ description }));

const update_guest = define_tool({
	name: 'update_guest',
	description: 'Admin only. Changes a guest: only the fields you give change; null clears a field.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		guest_id: id_input('The guest ID (search_guests).'),
		name: Schema.optionalKey(text_input("The guest's name.")),
		name_slug: Schema.optionalKey(text_input("The guest page's URL slug.")),
		twitter: optional_guest_link('Their Twitter/X handle.'),
		github: optional_guest_link('Their GitHub username.'),
		url: optional_guest_link('Their website.'),
		of: optional_guest_link('Where they work or what they make.')
	}),
	run: async (actor, input) => {
		const existing = await guests.get_guest_detail(actor, input.guest_id);
		if (!existing) error(404, 'Guest not found');

		return guests.update_guest(actor, {
			id: input.guest_id,
			name: input.name ?? existing.name,
			name_slug: input.name_slug ?? existing.name_slug,
			twitter: input.twitter !== undefined ? input.twitter : existing.twitter,
			github: input.github !== undefined ? input.github : existing.github,
			url: input.url !== undefined ? input.url : existing.url,
			of: input.of !== undefined ? input.of : existing.of
		});
	}
});

const set_submission_status = define_tool({
	name: 'set_submission_status',
	description:
		'Admin only. Sets the status of audience submissions: APPROVED or REJECTED to review them, COMPLETED once answered on a Show, PENDING to put one back.',
	access: 'admin',
	is_read_only: false,
	is_idempotent: true,
	input: Schema.Struct({
		submission_ids: Schema.Array(id_input('A submission ID (search_submissions).'))
			.check(Schema.isMinLength(1), Schema.isMaxLength(100))
			.annotate({ description: 'The submissions, 1 to 100.' }),
		status: Schema.Literals(SUBMISSION_STATUS_VALUES.enumValues).annotate({
			description: 'The new status.'
		})
	}),
	run: (actor, input) =>
		submissions.bulk_update_submission_status(actor, {
			submission_ids: [...input.submission_ids],
			status: input.status
		})
});

/** Every tool the endpoint serves, reads first. */
export const MCP_TOOLS: readonly McpTool[] = [
	search_shows,
	get_show,
	search_videos,
	search_content,
	get_content,
	search_guests,
	get_guest,
	search_tags,
	get_tag,
	get_admin_dashboard,
	search_submissions,
	get_seo_overview,
	list_seo_searches,
	get_seo_search,
	search_seo_keywords,
	list_seo_opportunities,
	create_show,
	update_show,
	search_hosts,
	update_video,
	create_article,
	update_article,
	set_content_status,
	add_content_tags,
	remove_content_tags,
	create_tag,
	update_tag,
	create_guest,
	update_guest,
	set_submission_status
];
