// Cleans YouTube auto-generated (ASR) caption cues for developer terms, AI tool names, and host
// names while preserving exact SRT timestamps and producing an objective word-correction report.
import { OPENROUTER_API_KEY } from '$app/env/private';
import { keywords, replacements } from '$server/transcripts/fixes';
import { strip_show_note_extras } from '$server/tags/tag_prompt';
import { as_array, as_number, as_string, read_path } from '#lib/utils/narrow.ts';
import type { CaptionCue } from './video_captions';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const CAPTION_CLEAN_MODEL = 'anthropic/claude-sonnet-5.5';
const CUES_PER_BATCH = 120;
const BATCH_CONCURRENCY = 3;
const MAX_DESCRIPTION_CHARS = 3_000;

export type CaptionFixKind = 'misheard' | 'format';

export type CaptionWordDiff = {
	from: string;
	to: string;
	kind: CaptionFixKind;
};

export type CaptionChangeSummary = {
	from: string;
	to: string;
	kind: CaptionFixKind;
	count: number;
	sample_cue_index: number;
	sample_before: string;
	sample_after: string;
};

export type CaptionCleanReport = {
	model: string;
	total_cues: number;
	cues_changed: number;
	total_words: number;
	misheard_fixes: number;
	format_fixes: number;
	rejected_edits: number;
	changes: CaptionChangeSummary[];
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		cost_usd: number;
	};
};

export type CaptionCleanContext = {
	title: string;
	description?: string;
	glossary?: readonly string[];
};

export type CaptionCleanResult = {
	cues: CaptionCue[];
	srt: string;
	report: CaptionCleanReport;
};

function pad(value: number, width = 2): string {
	return String(Math.floor(value)).padStart(width, '0');
}

/** Formats seconds as an SRT timestamp (`HH:MM:SS,mmm`). */
export function format_srt_time(seconds: number): string {
	const safe = Math.max(0, Math.round(seconds * 1000));
	const milliseconds = safe % 1000;
	const total_seconds = Math.floor(safe / 1000);
	const secs = total_seconds % 60;
	const total_minutes = Math.floor(total_seconds / 60);
	const mins = total_minutes % 60;
	const hours = Math.floor(total_minutes / 60);
	return `${pad(hours)}:${pad(mins)}:${pad(secs)},${pad(milliseconds, 3)}`;
}

/** Serializes caption cues back into a valid SRT file with original timings intact. */
export function format_srt(cues: readonly CaptionCue[]): string {
	return cues
		.map(
			(cue, index) =>
				`${index + 1}\n${format_srt_time(cue.start)} --> ${format_srt_time(cue.end)}\n${cue.text}`
		)
		.join('\n\n');
}

function escape_regex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize_alnum(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tokenize_words(text: string): string[] {
	return text.trim().split(/\s+/).filter(Boolean);
}

/** Applies high-confidence deterministic Syntax ASR replacements to every cue. */
export function apply_deterministic_fixes(
	cues: readonly CaptionCue[],
	table: ReadonlyMap<string, string> = replacements
): CaptionCue[] {
	const rules = [...table.entries()].map(([wrong, right]) => ({
		pattern: new RegExp(`(?<![A-Za-z0-9])${escape_regex(wrong)}(?![A-Za-z0-9])`, 'g'),
		right
	}));
	return cues.map((cue) => {
		let text = cue.text;
		for (const { pattern, right } of rules) {
			text = text.replace(pattern, right);
		}
		return { ...cue, text };
	});
}

/**
 * Guards against LLM edits that rewrite, truncate, or hallucinate a cue rather than fixing terms.
 * Allows small word-count shifts from compound splits/joins (e.g. "open code" <-> "OpenCode").
 */
export function is_safe_cue_edit(original: string, edited: string): boolean {
	const orig_trimmed = original.trim();
	const edit_trimmed = edited.trim();
	if (!edit_trimmed || orig_trimmed === edit_trimmed) return false;

	// Pure casing, spacing, or punctuation normalization (e.g. "open code" -> "OpenCode") is always safe
	const orig_alnum = normalize_alnum(orig_trimmed);
	const edit_alnum = normalize_alnum(edit_trimmed);
	if (orig_alnum && orig_alnum === edit_alnum) return true;

	const orig_words = tokenize_words(orig_trimmed);
	const edit_words = tokenize_words(edit_trimmed);
	if (orig_words.length === 0 || edit_words.length === 0) return false;

	const max_word_delta = Math.max(2, Math.ceil(orig_words.length * 0.25));
	if (Math.abs(edit_words.length - orig_words.length) > max_word_delta) return false;

	// Reject edits that replace most of the line instead of fixing specific terms
	const orig_norm = orig_words.map(normalize_alnum).filter(Boolean);
	const edit_set = new Set(edit_words.map(normalize_alnum).filter(Boolean));
	if (orig_norm.length >= 4) {
		const kept = orig_norm.filter(
			(word) => edit_set.has(word) || (word.length >= 3 && edit_alnum.includes(word))
		).length;
		if (kept / orig_norm.length < 0.5) return false;
	}
	return true;
}

/**
 * Computes word-span diffs between an original ASR cue and a cleaned cue using LCS alignment so
 * reports measure actual text changes rather than trusting LLM self-reporting.
 */
export function diff_cue_words(original: string, edited: string): CaptionWordDiff[] {
	const a = tokenize_words(original);
	const b = tokenize_words(edited);
	const n = a.length;
	const m = b.length;

	// DP table for longest common subsequence on exact tokens
	const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	const diffs: CaptionWordDiff[] = [];
	let i = 0;
	let j = 0;
	while (i < n || j < m) {
		if (i < n && j < m && a[i] === b[j]) {
			i++;
			j++;
			continue;
		}
		const from_tokens: string[] = [];
		const to_tokens: string[] = [];
		while (i < n || j < m) {
			if (i < n && j < m && a[i] === b[j]) break;
			if (i < n && (j === m || dp[i + 1][j] >= dp[i][j + 1])) {
				from_tokens.push(a[i++]);
			} else if (j < m) {
				to_tokens.push(b[j++]);
			}
		}
		const from = from_tokens.join(' ').replace(/^[,.;:!?]+|[,.;:!?]+$/g, '');
		const to = to_tokens.join(' ').replace(/^[,.;:!?]+|[,.;:!?]+$/g, '');
		if (!from && !to) continue;
		if (from === to) continue;
		const kind: CaptionFixKind =
			normalize_alnum(from) === normalize_alnum(to) ? 'format' : 'misheard';
		diffs.push({ from: from || '(inserted)', to: to || '(removed)', kind });
	}
	return diffs;
}

/** System prompt cached across batches for one video. */
export function build_caption_cleaner_system_prompt(
	extra_glossary: readonly string[] = []
): string {
	const terms = [...new Set([...keywords, ...extra_glossary])];
	return `You are a precision technical caption editor for the Syntax.fm software development and AI engineering YouTube channel (hosts: Wes Bos, Scott Tolinski, CJ Reynolds; backed by Sentry).

You receive numbered caption lines from YouTube's auto-generated (ASR) subtitles along with the video's title and description.

Your job: return ONLY lines that contain an unambiguous ASR error, fixing:
1. Misheard or misspelled developer terms, frameworks, libraries, CLI tools, protocols, AI models, hardware, and people's names (e.g. "Cloud Desktop" -> "Claude Desktop", "clawed code" -> "Claude Code", "Curo" -> "Kiro" when talking about AWS Kiro, "Olama" -> "Ollama", "Quinn 3.5" -> "Qwen 3.5", "speltkit" -> "SvelteKit", "contact 7" -> "Context7", "corors" -> "CORS", "Mamachi" -> "Omarchy", "MC key" -> "MCP").
2. Clear dev-term casing/spacing formatting when a technical noun is split or lowercased (e.g. "claude code" -> "Claude Code", "Llama CPP" -> "llama.cpp", "JSON L" -> "JSONL", "open code" -> "OpenCode", "next js" -> "Next.js").

STRICT ANTI-HALLUCINATION RULES:
- ONLY change a word when you are >95% certain from the surrounding lines and video description that ASR misheard it. If unsure between two tools or spellings, LEAVE IT UNCHANGED.
- NEVER change literal CLI command names or flags being spoken aloud (e.g. keep "bd", "bv", "gh", "git", "npx" as spoken — do NOT expand short CLI commands into full product names).
- NEVER alter model version numbers or parameter sizes (e.g. if ASR says "Quinn3 coder 30B", fix "Quinn3 coder" to "Qwen3-Coder" while KEEPING "30B" — never guess a different version or size).
- NEVER rewrite, paraphrase, summarize, remove filler words ("um", "like", "you know"), or change phrasing. Every line must stay spoken-word faithful to its timestamp.
- NEVER make pure punctuation or style tweaks to lines that have no wrong word or technical term. Skip accurate lines completely.

Canonical Syntax dev/AI glossary:
${terms.join(', ')}

Respond with valid JSON only:
{"fixes":[{"i":<line_index>,"t":"<corrected_full_line>"}]}`;
}

export function build_caption_batch_user_message(
	context: CaptionCleanContext,
	batch: readonly { index: number; text: string }[]
): string {
	const description = context.description
		? strip_show_note_extras(context.description).slice(0, MAX_DESCRIPTION_CHARS)
		: '';
	const lines = batch.map((item) => `${item.index}: ${item.text}`).join('\n');
	return [
		`Video title: ${context.title}`,
		description ? `Video description (context for proper nouns/tools):\n${description}` : '',
		`Caption lines:\n${lines}`
	]
		.filter(Boolean)
		.join('\n\n');
}

type BatchFix = { index: number; text: string };
type BatchUsage = { prompt_tokens: number; completion_tokens: number; cost_usd: number };

export function parse_cleaner_response(raw_content: string): BatchFix[] {
	const cleaned = raw_content
		.trim()
		.replace(/^```json\s*/i, '')
		.replace(/```$/, '')
		.trim();
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		const match = cleaned.match(/\{[\s\S]*\}/);
		if (!match) return [];
		try {
			parsed = JSON.parse(match[0]);
		} catch {
			return [];
		}
	}
	const fixes: BatchFix[] = [];
	for (const item of as_array(read_path(parsed, ['fixes']))) {
		const index = as_number(read_path(item, ['i']));
		const text = as_string(read_path(item, ['t']));
		if (index !== null && Number.isInteger(index) && text) {
			fixes.push({ index, text: text.replace(/\s+/g, ' ').trim() });
		}
	}
	return fixes;
}

async function request_batch_clean(
	system_prompt: string,
	context: CaptionCleanContext,
	batch: readonly { index: number; text: string }[],
	api_key: string,
	model: string
): Promise<{ fixes: BatchFix[]; usage: BatchUsage }> {
	const response = await fetch(OPENROUTER_CHAT_URL, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${api_key}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model,
			temperature: 0,
			messages: [
				{
					role: 'system',
					content: [{ type: 'text', text: system_prompt, cache_control: { type: 'ephemeral' } }]
				},
				{ role: 'user', content: build_caption_batch_user_message(context, batch) }
			],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'caption_fixes',
					strict: true,
					schema: {
						type: 'object',
						properties: {
							fixes: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										i: { type: 'integer' },
										t: { type: 'string' }
									},
									required: ['i', 't'],
									additionalProperties: false
								}
							}
						},
						required: ['fixes'],
						additionalProperties: false
					}
				}
			},
			usage: { include: true }
		})
	});
	const body_text = await response.text();
	if (!response.ok) {
		throw new Error(`OpenRouter caption cleaner ${response.status}: ${body_text.slice(0, 400)}`);
	}
	const parsed: unknown = JSON.parse(body_text);
	const message_content = as_string(read_path(parsed, ['choices', 0, 'message', 'content'])) ?? '';
	const prompt_tokens = as_number(read_path(parsed, ['usage', 'prompt_tokens'])) ?? 0;
	const completion_tokens = as_number(read_path(parsed, ['usage', 'completion_tokens'])) ?? 0;
	const cost_usd = as_number(read_path(parsed, ['usage', 'cost'])) ?? 0;
	return {
		fixes: parse_cleaner_response(message_content),
		usage: { prompt_tokens, completion_tokens, cost_usd }
	};
}

/** Builds a complete objective diff report comparing original ASR cues to cleaned cues. */
export function build_caption_clean_report(
	original_cues: readonly CaptionCue[],
	cleaned_cues: readonly CaptionCue[],
	meta: { model: string; rejected_edits: number; usage: BatchUsage }
): CaptionCleanReport {
	const total_words = original_cues.reduce((sum, cue) => sum + tokenize_words(cue.text).length, 0);
	let cues_changed = 0;
	let misheard_fixes = 0;
	let format_fixes = 0;
	const grouped = new Map<string, CaptionChangeSummary>();

	for (let index = 0; index < original_cues.length; index++) {
		const before = original_cues[index].text;
		const after = cleaned_cues[index]?.text ?? before;
		if (before === after) continue;
		cues_changed++;

		for (const diff of diff_cue_words(before, after)) {
			if (diff.kind === 'misheard') misheard_fixes++;
			else format_fixes++;

			const key = `${diff.kind}:${diff.from}=>${diff.to}`;
			const existing = grouped.get(key);
			if (existing) {
				existing.count++;
			} else {
				grouped.set(key, {
					from: diff.from,
					to: diff.to,
					kind: diff.kind,
					count: 1,
					sample_cue_index: index,
					sample_before: before,
					sample_after: after
				});
			}
		}
	}

	const changes = [...grouped.values()].sort((a, b) => {
		if (a.kind !== b.kind) return a.kind === 'misheard' ? -1 : 1;
		return b.count - a.count;
	});

	return {
		model: meta.model,
		total_cues: original_cues.length,
		cues_changed,
		total_words,
		misheard_fixes,
		format_fixes,
		rejected_edits: meta.rejected_edits,
		changes,
		usage: meta.usage
	};
}

/**
 * Cleans YouTube ASR caption cues in two passes:
 * 1. Deterministic Syntax glossary replacements.
 * 2. Conservative batched LLM pass via OpenRouter (Claude Sonnet 5.5) with sanity checks.
 */
export async function clean_caption_cues(
	original_cues: readonly CaptionCue[],
	context: CaptionCleanContext,
	options: { api_key?: string; model?: string; skip_llm?: boolean } = {}
): Promise<CaptionCleanResult> {
	const model = options.model ?? CAPTION_CLEAN_MODEL;
	const after_deterministic = apply_deterministic_fixes(original_cues);
	const working = after_deterministic.map((cue) => ({ ...cue }));
	let rejected_edits = 0;
	const usage: BatchUsage = { prompt_tokens: 0, completion_tokens: 0, cost_usd: 0 };

	if (!options.skip_llm && working.length > 0) {
		const api_key = options.api_key ?? OPENROUTER_API_KEY;
		if (!api_key) throw new Error('OPENROUTER_API_KEY is not set');

		const system_prompt = build_caption_cleaner_system_prompt(context.glossary);
		const batches: { index: number; text: string }[][] = [];
		for (let start = 0; start < working.length; start += CUES_PER_BATCH) {
			batches.push(
				working.slice(start, start + CUES_PER_BATCH).map((cue, offset) => ({
					index: start + offset,
					text: cue.text
				}))
			);
		}

		for (let start = 0; start < batches.length; start += BATCH_CONCURRENCY) {
			const group = batches.slice(start, start + BATCH_CONCURRENCY);
			const results = await Promise.all(
				group.map((batch) => request_batch_clean(system_prompt, context, batch, api_key, model))
			);
			for (const result of results) {
				usage.prompt_tokens += result.usage.prompt_tokens;
				usage.completion_tokens += result.usage.completion_tokens;
				usage.cost_usd += result.usage.cost_usd;
				for (const fix of result.fixes) {
					const current = working[fix.index];
					if (!current) continue;
					if (fix.text === current.text) continue;
					if (!is_safe_cue_edit(current.text, fix.text)) {
						rejected_edits++;
						continue;
					}
					current.text = fix.text;
				}
			}
		}
	}

	const report = build_caption_clean_report(original_cues, working, {
		model: options.skip_llm ? 'deterministic-only' : model,
		rejected_edits,
		usage
	});
	return { cues: working, srt: format_srt(working), report };
}
