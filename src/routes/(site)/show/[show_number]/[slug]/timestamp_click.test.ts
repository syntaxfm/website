import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { compileFunction } from 'node:vm';
import { parse } from 'svelte/compiler';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tsToS } from '$utilities/format_time.js';
import type { PlayerShow } from '$state/player_utils';

const { metrics_count } = vi.hoisted(() => ({ metrics_count: vi.fn() }));

vi.mock('@sentry/sveltekit', () => ({ metrics: { count: metrics_count } }));
vi.mock('$utilities/media/load_media_session', () => ({ load_media_session: vi.fn() }));
vi.mock('$state/player_offline', () => ({
	get_cached_or_network_show: async (show: PlayerShow) => show
}));
vi.mock('$state/player_utils', () => ({
	STORE_NAME: 'player_state',
	// Never settles, so the fire-and-forget IndexedDB save stays out of the way.
	open_db: () => new Promise(() => {}),
	load_state_from_indexed_db: async () => null
}));

import { player } from '$state/player';

interface ClickEvent {
	target: unknown;
	preventDefault: () => void;
}

// Stands in for the DOM anchor the handler checks with `instanceof` and reads `href` from.
class TestAnchor {
	constructor(private readonly href: string) {}
	matches(selector: string) {
		const contains = /^a\[href\*='(.+)'\]$/.exec(selector);
		return contains !== null && this.href.includes(contains[1]);
	}
	getAttribute(name: string) {
		return name === 'href' ? this.href : null;
	}
}

// The real `handleClick` from the layout: extracted from the Svelte AST, types stripped, and
// compiled against the real player store (`player` / `$player`) and `tsToS`.
const layout_source = readFileSync(new URL('./+layout.svelte', import.meta.url), 'utf8');
const handler_source = extract_handler(layout_source);

function extract_handler(source: string) {
	const handler = parse(source, { modern: true }).instance?.content.body.find(
		(node) => node.type === 'FunctionDeclaration' && node.id?.name === 'handleClick'
	);
	if (!handler?.loc) throw new Error('handleClick not found in +layout.svelte');
	const line_starts: number[] = [];
	let offset = 0;
	for (const line of source.split('\n')) {
		line_starts.push(offset);
		offset += line.length + 1;
	}
	const start = line_starts[handler.loc.start.line - 1] + handler.loc.start.column;
	const end = line_starts[handler.loc.end.line - 1] + handler.loc.end.column;
	return stripTypeScriptTypes(source.slice(start, end));
}

function is_click_handler(value: unknown): value is (event: ClickEvent) => Promise<void> {
	return typeof value === 'function';
}

async function click_timestamp(show: PlayerShow, href: string) {
	const factory = compileFunction(`${handler_source}\nreturn handleClick;`, [
		'player',
		'$player',
		'show',
		'tsToS',
		'HTMLAnchorElement'
	]);
	const handler: unknown = factory(player, get(player), show, tsToS, TestAnchor);
	if (!is_click_handler(handler)) throw new Error('handleClick did not compile to a function');
	const event = { target: new TestAnchor(href), preventDefault: vi.fn() };
	await handler(event);
	return event;
}

const page_show: PlayerShow = {
	number: 1012,
	title: 'Episode 1012',
	slug: 'episode-1012',
	url: 'https://example.com/1012.mp3'
};

// What play_timestamp does with the time (seek, resume, start, video or audio) is covered in player.test.ts
describe('show page timestamp click', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		metrics_count.mockReset();
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		player.reset();
	});

	it.each([
		['#t=00:44', 44],
		['#t=01:02:03', 3723]
	])('plays this show from %s', async (href, seconds) => {
		const play_timestamp = vi.spyOn(player, 'play_timestamp').mockResolvedValue(undefined);

		const event = await click_timestamp(page_show, href);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(play_timestamp).toHaveBeenCalledWith(page_show, seconds);
	});

	it('ignores clicks on links without a timestamp', async () => {
		const play_timestamp = vi.spyOn(player, 'play_timestamp');

		const event = await click_timestamp(page_show, '/show/1012/episode-1012');

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(play_timestamp).not.toHaveBeenCalled();
	});
});
