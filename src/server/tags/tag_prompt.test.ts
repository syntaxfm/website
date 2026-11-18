import { describe, expect, it } from 'vitest';
import {
	build_tag_request,
	build_tag_system_prompt,
	build_tag_user_message,
	get_tag_slug,
	MAX_LIBRARIES,
	read_chat_message,
	read_tag_answer,
	strip_show_note_extras,
	type TagTopic
} from './tag_prompt';

const topics: TagTopic[] = [
	{ slug: 'css', name: 'CSS', description: 'Styling with CSS.' },
	{ slug: 'functional', name: 'Functional Programming', description: null },
	{ slug: 'ai-coding', name: 'AI Coding', description: 'Writing software with AI.' }
];

describe('build_tag_system_prompt', () => {
	it('lists every topic and existing name, and the sponsor rule', () => {
		const prompt = build_tag_system_prompt(topics, ['Nuxt', 'Next.js']);
		expect(prompt).toContain('css: CSS - Styling with CSS.');
		expect(prompt).toContain('functional: Functional Programming\n');
		expect(prompt).toContain('Nuxt, Next.js');
		expect(prompt).toContain('ignore sponsor reads');
		expect(prompt).toContain('Sick Picks and Shameless Plugs');
	});
});

describe('strip_show_note_extras', () => {
	it('drops picks, plugs, socials and sponsor sections, keeps the rest', () => {
		const notes = [
			'Intro paragraph.',
			'### Show Notes',
			'* 00:00 CSS anchor positioning',
			'### Sick Picks',
			'- Scott: A blender',
			'### Shameless Plugs',
			'- Wes: Courses',
			'## Sentry - Sponsor',
			'Try Sentry',
			'### Links',
			'- MDN',
			'### Hit us up on Socials!',
			'X Instagram'
		].join('\n');
		expect(strip_show_note_extras(notes)).toBe(
			'Intro paragraph.\n### Show Notes\n* 00:00 CSS anchor positioning\n### Links\n- MDN'
		);
	});

	it('catches the old ××× SIIIIICK ××× PIIIICKS ××× heading', () => {
		expect(strip_show_note_extras('## ××× SIIIIICK ××× PIIIICKS ×××\n- A pick')).toBe('');
	});
});

describe('build_tag_user_message', () => {
	it('gives the title, description and transcript', () => {
		expect(
			build_tag_user_message({
				kind: 'episode',
				title: 'Effect',
				description: 'Notes',
				transcript: 'Hello'
			})
		).toBe(
			'This is a Syntax episode.\n\nTitle: Effect\n\nDescription:\nNotes\n\nTranscript:\nHello'
		);
	});

	it('leaves out what an item has none of', () => {
		expect(
			build_tag_user_message({
				kind: 'video',
				title: 'CSS Battle',
				description: '',
				transcript: ''
			})
		).toBe('This is a Syntax video.\n\nTitle: CSS Battle');
	});
});

describe('build_tag_request', () => {
	it('caches only the system prompt and holds topics to the list', () => {
		const request = build_tag_request('SYSTEM', ['css', 'ai-coding'], {
			kind: 'video',
			title: 'T',
			description: '',
			transcript: ''
		});
		expect(request.messages[0].content).toEqual([
			{ type: 'text', text: 'SYSTEM', cache_control: { type: 'ephemeral' } }
		]);
		expect('cache_control' in request).toBe(false);
		expect(request.response_format.json_schema.schema.properties.topics.items.enum).toEqual([
			'css',
			'ai-coding'
		]);
	});
});

describe('read_tag_answer', () => {
	it('keeps known topics and real libraries', () => {
		expect(
			read_tag_answer(
				'{"topics":["functional","ai-coding"],"libraries":["Effect","FoldKit"]}',
				topics
			)
		).toEqual({ topic_slugs: ['functional', 'ai-coding'], libraries: ['Effect', 'FoldKit'] });
	});

	it('drops unknown topics, repeats, and libraries that are really a topic', () => {
		expect(
			read_tag_answer(
				'{"topics":["css","made-up","css"],"libraries":["CSS"," StyleX ","stylex","Tailwind"]}',
				topics
			)
		).toEqual({ topic_slugs: ['css'], libraries: ['StyleX', 'Tailwind'] });
	});

	it('stops at the library limit', () => {
		const names = Array.from({ length: MAX_LIBRARIES + 3 }, (_, index) => `Lib ${index}`);
		const answer = read_tag_answer(JSON.stringify({ topics: [], libraries: names }), topics);
		expect(answer.libraries).toHaveLength(MAX_LIBRARIES);
	});

	it('fails loudly on an answer of the wrong shape', () => {
		expect(() => read_tag_answer('{"topics":"css"}', topics)).toThrow(TypeError);
		expect(() => read_tag_answer('not json', topics)).toThrow();
	});
});

describe('read_chat_message', () => {
	it('reads the first choice, or null for anything else', () => {
		expect(read_chat_message({ choices: [{ message: { content: '{"a":1}' } }] })).toBe('{"a":1}');
		expect(read_chat_message({ choices: [] })).toBeNull();
		expect(read_chat_message({ error: 'nope' })).toBeNull();
		expect(read_chat_message(null)).toBeNull();
	});
});

describe('get_tag_slug', () => {
	it('makes slugs like the existing tags', () => {
		expect(get_tag_slug('Next.js')).toBe('nextjs');
		expect(get_tag_slug('Node.js')).toBe('nodejs');
		expect(get_tag_slug('Functional Programming')).toBe('functional-programming');
	});
});
