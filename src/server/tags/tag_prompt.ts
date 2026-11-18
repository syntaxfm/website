import get_slug from 'speakingurl';

// The tag engine's prompt and answer, kept free of the database and network so they can be tested.
// Sonnet 5.5 won a side-by-side test against Clef and Haiku 5.5 on real episodes (Dex ki2egxin).

export const TAG_MODEL = 'anthropic/claude-sonnet-5.5';
export const MAX_TOPICS = 6;
export const MAX_LIBRARIES = 8;
// A long transcript is ~100k characters; this only guards against a runaway one
const MAX_TEXT_CHARACTERS = 300_000;
const MAX_DESCRIPTION_CHARACTERS = 3_000;

export type TagTopic = { slug: string; name: string; description: string | null };

export type TagInput = {
	kind: 'episode' | 'video';
	title: string;
	// Show notes or the YouTube description
	description: string;
	// Empty when there's no transcript yet
	transcript: string;
};

export type TagAnswer = { topic_slugs: string[]; libraries: string[] };

/** A tag's URL slug. Dots are dropped first, as the existing tags have them (Next.js: nextjs). */
export function get_tag_slug(name: string): string {
	return get_slug(name.replaceAll('.', ''), { separator: '-', truncate: 64, symbols: false });
}

/**
 * The system prompt: the rules, the topic list and every library name already in use. It's the same
 * for every item, so it's cached.
 */
export function build_tag_system_prompt(topics: TagTopic[], library_names: string[]): string {
	const topic_lines = topics.map(
		(topic) => `${topic.slug}: ${topic.name}${topic.description ? ` - ${topic.description}` : ''}`
	);
	return `You tag Syntax podcast episodes and YouTube videos so people can browse by topic. Give two kinds of tags.

1. topics: broad topics from the fixed list below that this item spends real time on. 1 to ${MAX_TOPICS}, most central first. A passing mention doesn't count. Prefer fewer, accurate topics over many loose ones.

2. libraries: the specific libraries, frameworks, languages, tools, products and services this item spends real time on (e.g. Effect, Nuxt, StyleX, Tailscale, Caddy). 0 to ${MAX_LIBRARIES}, most central first.

For both kinds, ignore sponsor reads and ads ("this episode is brought to you by..."), and the Sick Picks and Shameless Plugs segments at the end of an episode: they aren't what the item is about.

Library rules:
- A passing mention doesn't count.
- Not language features or APIs (attr(), Promise.allKeyed()), not companies or people unless they are the product.
- Never repeat a topic as a library: CSS is a topic, not a library.
- Use the official name and spelling. If one of the existing names below is the same thing, use it exactly.

Topics (slug: name - description):
${topic_lines.join('\n')}

Existing names:
${library_names.join(', ')}`;
}

// Show note sections that aren't what the episode is about: picks, plugs, socials, sponsors
const EXTRA_SECTION_HEADING = /^#+ .*(sick|s+i+c+k|shameless|hit us up|tweet us|sponsor)/i;
const HEADING = /^#+ /;

/** Show notes without their Sick Picks, Shameless Plugs, socials and sponsor sections. */
export function strip_show_note_extras(notes: string): string {
	const kept: string[] = [];
	let is_skipping = false;
	for (const line of notes.split('\n')) {
		if (HEADING.test(line)) is_skipping = EXTRA_SECTION_HEADING.test(line);
		if (!is_skipping) kept.push(line);
	}
	return kept.join('\n').trim();
}

/** What the model reads about one item. */
export function build_tag_user_message(input: TagInput): string {
	const description = strip_show_note_extras(input.description);
	return [
		`This is a Syntax ${input.kind}.`,
		`Title: ${input.title}`,
		description ? `Description:\n${description.slice(0, MAX_DESCRIPTION_CHARACTERS)}` : '',
		input.transcript ? `Transcript:\n${input.transcript.slice(0, MAX_TEXT_CHARACTERS)}` : ''
	]
		.filter(Boolean)
		.join('\n\n');
}

/**
 * An OpenRouter chat request. Only the system prompt is cached: caching the whole request would
 * also write each transcript to the cache at 1.25x, and a transcript is never read again.
 */
export function build_tag_request(system_prompt: string, topic_slugs: string[], input: TagInput) {
	return {
		model: TAG_MODEL,
		messages: [
			{
				role: 'system',
				content: [{ type: 'text', text: system_prompt, cache_control: { type: 'ephemeral' } }]
			},
			{ role: 'user', content: build_tag_user_message(input) }
		],
		response_format: {
			type: 'json_schema',
			json_schema: {
				name: 'tags',
				strict: true,
				schema: {
					type: 'object',
					properties: {
						topics: { type: 'array', items: { type: 'string', enum: topic_slugs } },
						libraries: { type: 'array', items: { type: 'string' } }
					},
					required: ['topics', 'libraries'],
					additionalProperties: false
				}
			}
		},
		usage: { include: true }
	};
}

/** The first choice's message text from an OpenAI-style chat response, or null. */
export function read_chat_message(response: unknown): string | null {
	if (typeof response !== 'object' || response === null || !('choices' in response)) return null;
	const { choices } = response;
	if (!Array.isArray(choices)) return null;
	const first: unknown = choices[0];
	if (typeof first !== 'object' || first === null || !('message' in first)) return null;
	const { message } = first;
	if (typeof message !== 'object' || message === null || !('content' in message)) return null;
	return typeof message.content === 'string' ? message.content : null;
}

function is_string_array(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * The model's answer, checked: known topics only, no library that is really a topic, no repeats,
 * and no more than the limits. Throws when the answer isn't the expected shape.
 */
export function read_tag_answer(content: string, topics: TagTopic[]): TagAnswer {
	const parsed: unknown = JSON.parse(content);
	if (typeof parsed !== 'object' || parsed === null) {
		throw new TypeError(`Tag answer isn't an object: ${content.slice(0, 200)}`);
	}
	const topic_values = 'topics' in parsed ? parsed.topics : undefined;
	const library_values = 'libraries' in parsed ? parsed.libraries : undefined;
	if (!is_string_array(topic_values) || !is_string_array(library_values)) {
		throw new TypeError(`Tag answer is missing topics or libraries: ${content.slice(0, 200)}`);
	}

	const known_slugs = new Set(topics.map((topic) => topic.slug));
	const topic_slugs = [...new Set(topic_values.filter((slug) => known_slugs.has(slug)))].slice(
		0,
		MAX_TOPICS
	);

	// "CSS" as a library when CSS is a topic: the topic already covers it
	const topic_keys = new Set(
		topics.flatMap((topic) => [get_tag_slug(topic.name), get_tag_slug(topic.slug)])
	);
	const seen = new Set<string>();
	const libraries: string[] = [];
	for (const raw_name of library_values) {
		const name = raw_name.trim();
		const key = get_tag_slug(name);
		if (!key || topic_keys.has(key) || seen.has(key)) continue;
		seen.add(key);
		libraries.push(name);
		if (libraries.length === MAX_LIBRARIES) break;
	}

	return { topic_slugs, libraries };
}
