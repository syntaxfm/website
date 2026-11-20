// Resumable CLI for trickling priority YouTube ASR caption cleanups inside the default 10,000
// daily YouTube Data API quota (650 units/video: captions.list 50 + download 200 + insert 400).
//
// Usage:
//   node scripts/clean-youtube-captions.ts --status
//   node scripts/clean-youtube-captions.ts --limit=3 --dry-run --prod-token
//   node scripts/clean-youtube-captions.ts --limit=3 --prod-token
//   node scripts/clean-youtube-captions.ts --video=1FqiNnOsrgM --prod-token
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { keywords, replacements } from '../src/server/transcripts/fixes.ts';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const QUEUE_PATH = path.join(ROOT, 'scripts/youtube-caption-queue.json');
const YT_API = 'https://www.googleapis.com/youtube/v3';
const YT_UPLOAD = 'https://www.googleapis.com/upload/youtube/v3';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-sonnet-5.5';
const CUES_PER_BATCH = 120;
const BATCH_CONCURRENCY = 3;

type QueueEntry = {
	id: string;
	title: string;
	topic: string;
	status: 'pending' | 'done' | 'skipped';
	cleaned_at?: string;
	track_id?: string;
	words?: number;
	cues_changed?: number;
	misheard_fixes?: number;
	format_fixes?: number;
	top_changes?: string[];
	note?: string;
};

type QueueFile = {
	note: string;
	videos: QueueEntry[];
};

type Cue = { start: number; end: number; text: string };

function load_env(): Record<string, string> {
	const env: Record<string, string> = {};
	for (const file of ['.env', '.env.local']) {
		const full = path.join(ROOT, file);
		if (!fs.existsSync(full)) continue;
		for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
			const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
			if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
		}
	}
	return env;
}

function read_queue(): QueueFile {
	return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8')) as QueueFile;
}

function write_queue(queue: QueueFile): void {
	fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(queue, null, '\t')}\n`, 'utf8');
}

function print_status(queue: QueueFile): void {
	const done = queue.videos.filter((v) => v.status === 'done');
	const pending = queue.videos.filter((v) => v.status === 'pending');
	const skipped = queue.videos.filter((v) => v.status === 'skipped');
	const total_misheard = done.reduce((sum, v) => sum + (v.misheard_fixes ?? 0), 0);
	const total_format = done.reduce((sum, v) => sum + (v.format_fixes ?? 0), 0);

	console.log(
		`YouTube ASR Caption Queue: ${done.length}/${queue.videos.length} done · ${pending.length} pending · ${skipped.length} skipped`
	);
	console.log(
		`Total corrections uploaded so far: ${total_misheard} misheard words + ${total_format} format fixes`
	);
	if (done.length > 0) {
		console.log('\nDone:');
		for (const v of done) {
			console.log(
				`  [x] ${v.id} | ${v.title} (${v.misheard_fixes ?? 0} misheard, ${v.format_fixes ?? 0} format)`
			);
		}
	}
	if (pending.length > 0) {
		console.log('\nNext up:');
		for (const v of pending.slice(0, 10)) {
			console.log(`  [ ] ${v.id} | [${v.topic}] ${v.title}`);
		}
		if (pending.length > 10) console.log(`  ... and ${pending.length - 10} more`);
	}
}

async function get_youtube_token(
	env: Record<string, string>,
	use_prod_token: boolean
): Promise<string> {
	const db_url = use_prod_token ? env.PROD_DATABASE_URL : env.DATABASE_URL;
	if (!db_url) {
		throw new Error(use_prod_token ? 'PROD_DATABASE_URL is not set' : 'DATABASE_URL is not set');
	}
	const sql = postgres(db_url, {
		...(use_prod_token ? { ssl: 'require' } : {}),
		max: 1,
		idle_timeout: 5
	});
	let refresh_token: string | undefined;
	try {
		const rows = await sql<{ refresh_token: string }[]>`
			SELECT refresh_token FROM oauth_connections
			WHERE provider = 'youtube' AND failed_at IS NULL
			LIMIT 1
		`;
		refresh_token = rows[0]?.refresh_token;
	} finally {
		await sql.end();
	}
	if (!refresh_token) {
		throw new Error(
			'No YouTube OAuth token found in oauth_connections (pass --prod-token to read from PROD_DATABASE_URL read-only)'
		);
	}
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		body: new URLSearchParams({
			client_id: env.YOUTUBE_CLIENT_ID,
			client_secret: env.YOUTUBE_CLIENT_SECRET,
			refresh_token,
			grant_type: 'refresh_token'
		})
	});
	const body = (await response.json()) as { access_token?: string; error?: string };
	if (!response.ok || !body.access_token) {
		throw new Error(`Token refresh failed: ${body.error ?? response.status}`);
	}
	return body.access_token;
}

function pad(value: number, width = 2): string {
	return String(Math.floor(value)).padStart(width, '0');
}

function format_srt_time(seconds: number): string {
	const safe = Math.max(0, Math.round(seconds * 1000));
	const ms = safe % 1000;
	const tot = Math.floor(safe / 1000);
	const secs = tot % 60;
	const tot_mins = Math.floor(tot / 60);
	return `${pad(Math.floor(tot_mins / 60))}:${pad(tot_mins % 60)}:${pad(secs)},${pad(ms, 3)}`;
}

function format_srt(cues: readonly Cue[]): string {
	return cues
		.map((c, i) => `${i + 1}\n${format_srt_time(c.start)} --> ${format_srt_time(c.end)}\n${c.text}`)
		.join('\n\n');
}

function srt_seconds(time: string): number {
	const match = time.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);
	if (!match) throw new Error(`Invalid SRT time: ${time}`);
	return (
		Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000
	);
}

function parse_srt(srt: string): Cue[] {
	return srt
		.replace(/\r/g, '')
		.split(/\n{2,}/)
		.flatMap((block) => {
			const lines = block.trim().split('\n');
			const ti = lines.findIndex((l) => l.includes('-->'));
			if (ti === -1) return [];
			const [start, end] = lines[ti].split('-->');
			const text = lines
				.slice(ti + 1)
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim();
			return text ? [{ start: srt_seconds(start), end: srt_seconds(end), text }] : [];
		});
}

function escape_regex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize_alnum(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tokenize(text: string): string[] {
	return text.trim().split(/\s+/).filter(Boolean);
}

function is_safe_edit(original: string, edited: string): boolean {
	const orig_t = original.trim();
	const edit_t = edited.trim();
	if (!edit_t || orig_t === edit_t) return false;
	const orig_a = normalize_alnum(orig_t);
	const edit_a = normalize_alnum(edit_t);
	if (orig_a && orig_a === edit_a) return true;
	const orig_w = tokenize(orig_t);
	const edit_w = tokenize(edit_t);
	if (!orig_w.length || !edit_w.length) return false;
	if (Math.abs(edit_w.length - orig_w.length) > Math.max(2, Math.ceil(orig_w.length * 0.25))) {
		return false;
	}
	const orig_norm = orig_w.map(normalize_alnum).filter(Boolean);
	const edit_set = new Set(edit_w.map(normalize_alnum).filter(Boolean));
	if (
		orig_norm.length >= 4 &&
		orig_norm.filter((w) => edit_set.has(w) || (w.length >= 3 && edit_a.includes(w))).length /
			orig_norm.length <
			0.5
	) {
		return false;
	}
	return true;
}

function diff_words(original: string, edited: string) {
	const a = tokenize(original);
	const b = tokenize(edited);
	const n = a.length;
	const m = b.length;
	const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}
	const diffs: { from: string; to: string; kind: 'misheard' | 'format' }[] = [];
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
			if (i < n && (j === m || dp[i + 1][j] >= dp[i][j + 1])) from_tokens.push(a[i++]);
			else if (j < m) to_tokens.push(b[j++]);
		}
		const from = from_tokens.join(' ').replace(/^[,.;:!?]+|[,.;:!?]+$/g, '');
		const to = to_tokens.join(' ').replace(/^[,.;:!?]+|[,.;:!?]+$/g, '');
		if ((!from && !to) || from === to) continue;
		diffs.push({
			from,
			to,
			kind: normalize_alnum(from) === normalize_alnum(to) ? 'format' : 'misheard'
		});
	}
	return diffs;
}

const SYSTEM_PROMPT = `You are a precision technical caption editor for the Syntax.fm software development and AI engineering YouTube channel (hosts: Wes Bos, Scott Tolinski, CJ Reynolds; backed by Sentry).

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
${keywords.join(', ')}`;

const RESPONSE_FORMAT = {
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
						properties: { i: { type: 'integer' }, t: { type: 'string' } },
						required: ['i', 't'],
						additionalProperties: false
					}
				}
			},
			required: ['fixes'],
			additionalProperties: false
		}
	}
};

class QuotaExceededError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'QuotaExceededError';
	}
}

async function yt_fetch(url: string, init: RequestInit): Promise<Response> {
	const response = await fetch(url, init);
	if (response.status === 403) {
		const text = await response.clone().text();
		if (text.includes('quotaExceeded')) {
			throw new QuotaExceededError('YouTube Data API daily quota exceeded — stopping cleanly.');
		}
	}
	return response;
}

async function clean_one_video(
	video_id: string,
	yt_token: string,
	openrouter_key: string,
	dry_run: boolean
): Promise<Partial<QueueEntry> & { status: QueueEntry['status'] }> {
	const meta_res = await yt_fetch(`${YT_API}/videos?part=snippet&id=${video_id}`, {
		headers: { authorization: `Bearer ${yt_token}` }
	});
	const meta_json = (await meta_res.json()) as {
		items?: { snippet: { title: string; description: string } }[];
	};
	const snippet = meta_json.items?.[0]?.snippet;
	if (!snippet) throw new Error(`Video ${video_id} not found`);

	const list_res = await yt_fetch(`${YT_API}/captions?part=snippet&videoId=${video_id}`, {
		headers: { authorization: `Bearer ${yt_token}` }
	});
	const list_json = (await list_res.json()) as {
		items?: { id: string; snippet: { language?: string; trackKind?: string } }[];
	};
	const en_tracks = (list_json.items ?? []).filter((t) => t.snippet.language?.startsWith('en'));
	const standard = en_tracks.find((t) => t.snippet.trackKind?.toLowerCase() === 'standard');
	if (standard) {
		console.log(`SKIP ${video_id} (${snippet.title}): already has standard track ${standard.id}`);
		return {
			status: 'done',
			track_id: standard.id,
			note: 'Already had a standard English caption track on YouTube'
		};
	}
	const asr = en_tracks.find((t) => t.snippet.trackKind?.toLowerCase() === 'asr');
	if (!asr) {
		console.log(`SKIP ${video_id} (${snippet.title}): no English ASR track`);
		return { status: 'skipped', note: 'No English ASR track found' };
	}

	const dl_res = await yt_fetch(`${YT_API}/captions/${asr.id}?tfmt=srt`, {
		headers: { authorization: `Bearer ${yt_token}` }
	});
	if (!dl_res.ok) throw new Error(`captions.download failed (${dl_res.status})`);
	const raw_srt = await dl_res.text();

	const original = parse_srt(raw_srt);
	const rules = [...replacements.entries()].map(([wrong, right]) => ({
		pattern: new RegExp(`(?<![A-Za-z0-9])${escape_regex(wrong)}(?![A-Za-z0-9])`, 'g'),
		right
	}));
	const working = original.map((cue) => {
		let text = cue.text;
		for (const { pattern, right } of rules) text = text.replace(pattern, right);
		return { ...cue, text };
	});

	const batches: { index: number; text: string }[][] = [];
	for (let start = 0; start < working.length; start += CUES_PER_BATCH) {
		batches.push(
			working
				.slice(start, start + CUES_PER_BATCH)
				.map((cue, offset) => ({ index: start + offset, text: cue.text }))
		);
	}

	let rejected = 0;
	for (let start = 0; start < batches.length; start += BATCH_CONCURRENCY) {
		const results = await Promise.all(
			batches.slice(start, start + BATCH_CONCURRENCY).map(async (batch) => {
				const res = await fetch(OPENROUTER_URL, {
					method: 'POST',
					headers: {
						authorization: `Bearer ${openrouter_key}`,
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						model: MODEL,
						temperature: 0,
						response_format: RESPONSE_FORMAT,
						messages: [
							{
								role: 'system',
								content: [
									{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
								]
							},
							{
								role: 'user',
								content: `Video title: ${snippet.title}\n\nVideo description:\n${(snippet.description ?? '').slice(0, 3000)}\n\nCaption lines:\n${batch.map((x) => `${x.index}: ${x.text}`).join('\n')}`
							}
						]
					})
				});
				const txt = await res.text();
				if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${txt.slice(0, 300)}`);
				const data = JSON.parse(txt) as { choices?: { message?: { content?: string } }[] };
				const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{"fixes":[]}') as {
					fixes?: { i: number; t: string }[];
				};
				return parsed.fixes ?? [];
			})
		);
		for (const fixes of results) {
			for (const fix of fixes) {
				const cur = working[fix.i];
				if (!cur || !fix.t || fix.t.trim() === cur.text) continue;
				if (!is_safe_edit(cur.text, fix.t)) {
					rejected++;
					continue;
				}
				cur.text = fix.t.replace(/\s+/g, ' ').trim();
			}
		}
	}

	const words = original.reduce((sum, cue) => sum + tokenize(cue.text).length, 0);
	let cues_changed = 0;
	let misheard_fixes = 0;
	let format_fixes = 0;
	const grouped = new Map<string, number>();
	for (let i = 0; i < original.length; i++) {
		if (original[i].text === working[i].text) continue;
		cues_changed++;
		for (const diff of diff_words(original[i].text, working[i].text)) {
			if (diff.kind === 'misheard') misheard_fixes++;
			else format_fixes++;
			const key = `${diff.from} -> ${diff.to}`;
			grouped.set(key, (grouped.get(key) ?? 0) + 1);
		}
	}
	const top_changes = [...grouped.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([k, count]) => `${k} (${count}x)`);

	console.log(`\n=== ${dry_run ? 'DRY-RUN' : 'CLEANED'}: ${video_id} (${snippet.title}) ===`);
	console.log(
		`Words: ${words} | Cues changed: ${cues_changed}/${original.length} | Misheard: ${misheard_fixes} | Format: ${format_fixes} | Guard rejected: ${rejected}`
	);
	for (const line of top_changes) console.log(`  ${line}`);

	if (dry_run || cues_changed === 0) {
		return {
			status: cues_changed === 0 ? 'skipped' : 'pending',
			words,
			cues_changed,
			misheard_fixes,
			format_fixes,
			top_changes
		};
	}

	const boundary = `syntax-captions-${randomUUID()}`;
	const metadata = { snippet: { videoId: video_id, language: 'en', name: '', isDraft: false } };
	const multipart = [
		`--${boundary}`,
		'Content-Type: application/json; charset=UTF-8',
		'',
		JSON.stringify(metadata),
		`--${boundary}`,
		'Content-Type: application/octet-stream',
		'',
		format_srt(working),
		`--${boundary}--`,
		''
	].join('\r\n');

	const upload_res = await yt_fetch(`${YT_UPLOAD}/captions?part=snippet&uploadType=multipart`, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${yt_token}`,
			'content-type': `multipart/related; boundary=${boundary}`
		},
		body: multipart
	});
	const upload_text = await upload_res.text();
	if (!upload_res.ok) {
		throw new Error(`captions.insert ${upload_res.status}: ${upload_text.slice(0, 300)}`);
	}
	const uploaded = JSON.parse(upload_text) as { id?: string };
	console.log(`Uploaded standard track: ${uploaded.id}`);

	return {
		status: 'done',
		cleaned_at: new Date().toISOString(),
		track_id: uploaded.id,
		words,
		cues_changed,
		misheard_fixes,
		format_fixes,
		top_changes
	};
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const queue = read_queue();

	if (args.includes('--status') || args.length === 0) {
		print_status(queue);
		return;
	}

	const dry_run = args.includes('--dry-run');
	const use_prod_token = args.includes('--prod-token');
	const limit_arg = args.find((a) => a.startsWith('--limit='));
	const limit = limit_arg ? Math.max(1, Number(limit_arg.split('=')[1])) : 3;
	const video_arg = args.find((a) => a.startsWith('--video='))?.split('=')[1];

	const env = load_env();
	if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');
	const yt_token = await get_youtube_token(env, use_prod_token);

	const targets = video_arg
		? queue.videos.filter((v) => v.id === video_arg)
		: queue.videos.filter((v) => v.status === 'pending').slice(0, limit);

	if (targets.length === 0) {
		console.log(video_arg ? `Video ${video_arg} not found in queue.` : 'Queue is 100% complete!');
		return;
	}

	for (const entry of targets) {
		try {
			const update = await clean_one_video(entry.id, yt_token, env.OPENROUTER_API_KEY, dry_run);
			if (!dry_run) {
				Object.assign(entry, update);
				write_queue(queue);
			}
		} catch (err) {
			if (err instanceof QuotaExceededError) {
				console.error(`\n${err.message}`);
				break;
			}
			console.error(`Failed on ${entry.id}:`, err);
		}
	}

	console.log('');
	print_status(queue);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
