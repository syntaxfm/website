import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { compileFunction } from 'node:vm';
import { parse } from 'svelte/compiler';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tsToS } from '$utilities/format_time.js';
import type { PlayerShow, PlayerState } from '$state/player_utils';

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

describe('show page timestamp click', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		metrics_count.mockReset();
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
		player.reset();
	});

	function spy_on_player() {
		return {
			start_show: vi.spyOn(player, 'start_show'),
			update_time: vi.spyOn(player, 'update_time'),
			play: vi.spyOn(player, 'play')
		};
	}

	const not_playing: PlayerState['status'][] = ['LOADED', 'PAUSED'];

	it.each(not_playing)(
		'seeks then plays this show when it is already current and %s',
		async (status) => {
			player.set({ ...get(player), current_show: page_show, status });
			const spies = spy_on_player();

			const event = await click_timestamp(page_show, '#t=00:44');

			expect(event.preventDefault).toHaveBeenCalled();
			expect(spies.start_show).not.toHaveBeenCalled();
			expect(spies.update_time).toHaveBeenCalledWith(44);
			expect(spies.play).toHaveBeenCalledOnce();
			expect(spies.update_time.mock.invocationCallOrder[0]).toBeLessThan(
				spies.play.mock.invocationCallOrder[0]
			);
			expect(get(player).status).toBe('PLAYING');
			expect(metrics_count).not.toHaveBeenCalled();
		}
	);

	it('only seeks when this show is already playing', async () => {
		player.set({ ...get(player), current_show: page_show, status: 'PLAYING' });
		const spies = spy_on_player();

		await click_timestamp(page_show, '#t=01:02:03');

		expect(spies.start_show).not.toHaveBeenCalled();
		expect(spies.update_time).toHaveBeenCalledWith(3723);
		expect(spies.play).not.toHaveBeenCalled();
		expect(get(player).status).toBe('PLAYING');
		expect(metrics_count).not.toHaveBeenCalled();
	});

	it('starts this show at the timestamp when a different show is playing', async () => {
		const other_show: PlayerShow = {
			...page_show,
			number: 900,
			url: 'https://example.com/900.mp3'
		};
		player.set({ ...get(player), current_show: other_show, status: 'PLAYING' });
		const spies = spy_on_player();

		await click_timestamp(page_show, '#t=00:44');

		expect(spies.start_show).toHaveBeenCalledWith(page_show, 44);
		expect(spies.update_time).not.toHaveBeenCalled();
		expect(spies.play).toHaveBeenCalledOnce();
		expect(metrics_count).toHaveBeenCalledWith('episode_start', 1, {
			attributes: { episode: 1012 }
		});
		expect(get(player).status).toBe('PLAYING');
	});

	it('ignores clicks on links without a timestamp', async () => {
		const spies = spy_on_player();

		const event = await click_timestamp(page_show, '/show/1012/episode-1012');

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(spies.start_show).not.toHaveBeenCalled();
		expect(spies.update_time).not.toHaveBeenCalled();
	});
});
