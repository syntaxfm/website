import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/private', () => ({ OPENROUTER_API_KEY: '' }));

import {
	apply_deterministic_fixes,
	clean_caption_cues,
	diff_cue_words,
	format_srt,
	format_srt_time,
	is_safe_cue_edit,
	parse_cleaner_response
} from './caption_cleaner';
import { parse_srt } from './video_captions';

describe('format_srt_time & format_srt', () => {
	it('formats timestamps with hours, minutes, seconds and milliseconds', () => {
		expect(format_srt_time(0.08)).toBe('00:00:00,080');
		expect(format_srt_time(65.5)).toBe('00:01:05,500');
		expect(format_srt_time(3661.125)).toBe('01:01:01,125');
	});

	it('round-trips through parse_srt without losing timing or text', () => {
		const cues = [
			{ start: 0.08, end: 3.2, text: "Hey, what's up? This is Scott with Level Up Tuts" },
			{ start: 3.2, end: 6.45, text: 'Talking about Claude Code and MCP servers' }
		];
		expect(parse_srt(format_srt(cues))).toEqual(cues);
	});
});

describe('apply_deterministic_fixes', () => {
	it('fixes unambiguous Syntax ASR mangles without touching unrelated substrings', () => {
		const cues = [
			{ start: 0, end: 3, text: 'Hey Westboss and Tinsky from Level Up Tutts' },
			{ start: 3, end: 6, text: 'Try Olama with speltkit and Glamma CPP on Andy Stricks Halo' },
			{ start: 6, end: 9, text: 'I am running Mamachi with chat GBT' }
		];
		const fixed = apply_deterministic_fixes(cues);
		expect(fixed.map((cue) => cue.text)).toEqual([
			'Hey Wes Bos and Tolinski from Level Up Tuts',
			'Try Ollama with SvelteKit and llama.cpp on AMD Strix Halo',
			'I am running Omarchy with ChatGPT'
		]);
	});
});

describe('is_safe_cue_edit', () => {
	it('accepts targeted dev-term fixes and compound joins', () => {
		expect(
			is_safe_cue_edit(
				'we saw that happen inside of Cloud Desktop yesterday',
				'we saw that happen inside of Claude Desktop yesterday'
			)
		).toBe(true);
		expect(
			is_safe_cue_edit('using open code and JSON L files', 'using OpenCode and JSONL files')
		).toBe(true);
	});

	it('rejects empty edits, no-ops, truncations, and wholesale rewrites', () => {
		expect(is_safe_cue_edit('hello world', 'hello world')).toBe(false);
		expect(is_safe_cue_edit('hello world', '')).toBe(false);
		expect(
			is_safe_cue_edit('one two three four five six seven eight nine ten', 'one two three')
		).toBe(false);
		expect(
			is_safe_cue_edit(
				'running local models on your home server',
				'completely invented sentence about bananas today'
			)
		).toBe(false);
	});
});

describe('diff_cue_words & build_caption_clean_report', () => {
	it('separates actual misheard words from casing/spacing format fixes', () => {
		expect(
			diff_cue_words('using Cloud Desktop with JSON L', 'using Claude Desktop with JSONL')
		).toEqual([
			{ from: 'Cloud', to: 'Claude', kind: 'misheard' },
			{ from: 'JSON L', to: 'JSONL', kind: 'format' }
		]);
	});

	it('aggregates counts and samples sorted by misheard first, then frequency', async () => {
		const original = [
			{ start: 0, end: 2, text: 'Hey Westboss from Level Up Tutts' },
			{ start: 2, end: 4, text: 'Westboss loves speltkit' },
			{ start: 4, end: 6, text: 'Nothing wrong on this line' }
		];
		const result = await clean_caption_cues(original, { title: 'Test' }, { skip_llm: true });
		expect(result.report.total_cues).toBe(3);
		expect(result.report.cues_changed).toBe(2);
		expect(result.report.misheard_fixes).toBe(4);
		expect(result.report.format_fixes).toBe(0);
		expect(result.report.changes[0]).toMatchObject({
			from: 'Westboss',
			to: 'Wes Bos',
			kind: 'misheard',
			count: 2
		});
	});
});

describe('parse_cleaner_response', () => {
	it('parses plain JSON and fenced JSON responses safely', () => {
		expect(parse_cleaner_response('{"fixes":[{"i":4,"t":"Claude Code rocks"}]}')).toEqual([
			{ index: 4, text: 'Claude Code rocks' }
		]);
		expect(
			parse_cleaner_response('```json\n{"fixes":[{"i":2,"t":"  MCP  server "}]}\n```')
		).toEqual([{ index: 2, text: 'MCP server' }]);
		expect(parse_cleaner_response('not json at all')).toEqual([]);
	});
});
