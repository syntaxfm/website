<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import Collage from '#lib/collage/Collage.svelte';
	import {
		build_ascii_wordmark,
		frame_glyph,
		wordmark_layers,
		type WordmarkLayers
	} from './ascii_wordmark';

	/** How long the left-to-right sweep takes to start every column. */
	const SWEEP_MS = 700;
	/** How long each cell flickers before it settles. */
	const FLICKER_MS = 260;
	const HEAT_RADIUS_COLUMNS = 9;
	/** A row is about twice as tall as a column is wide. */
	const ROW_STRETCH = 2.2;
	/** Per frame: the trail behind the pointer fades over about half a second. */
	const HEAT_DECAY = 0.95;

	/** The first Syntax episode, 2017-07-05. */
	const SYNTAX_STARTED_AT = 1499256000000;
	const COUNTER_MS = 50;
	const REDUCED_MOTION_COUNTER_MS = 1000;

	let shuffles = $state(0);
	let now = $state(Date.now());
	/** Only true while the card is on screen: the counter and decode only run then. */
	let is_in_view = $state(false);
	// Each page gets its own collage and dots; a click reshuffles on top of that.
	const seed = $derived(`syntax-footer:${page.url.pathname}:${shuffles}`);
	const caption = $derived(
		`empowering developers for ${(now - SYNTAX_STARTED_AT).toLocaleString('en-US')} ms`
	);
	const wordmark = $derived(build_ascii_wordmark(seed, caption));
	const settled = $derived(wordmark_layers(wordmark));
	/** Set only while something is moving; otherwise the settled text renders. */
	let frame = $state<WordmarkLayers | null>(null);
	const layers = $derived(frame ?? settled);

	let card: HTMLElement | undefined = $state();
	let heat = new Float32Array(0);
	let reveal_delays = new Float32Array(0);
	let decode_started_at = -1;
	let animation_frame = 0;

	function prefers_reduced_motion() {
		return matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function ensure_buffers() {
		const cells = wordmark.kinds.length;
		if (heat.length !== cells) heat = new Float32Array(cells);
	}

	function tick(now: number) {
		animation_frame = 0;
		const elapsed = decode_started_at < 0 ? Infinity : now - decode_started_at;
		const is_decoding = elapsed < SWEEP_MS + FLICKER_MS * 2;
		let is_warm = false;
		const glyphs = wordmark.kinds.map((_, index) => {
			const reveal = is_decoding ? (elapsed - reveal_delays[index]) / FLICKER_MS : 1;
			heat[index] *= HEAT_DECAY;
			if (heat[index] < 0.02) heat[index] = 0;
			else is_warm = true;
			return frame_glyph(wordmark, index, reveal, heat[index], Math.random);
		});
		if (!is_decoding) decode_started_at = -1;
		if (is_decoding || is_warm) {
			frame = wordmark_layers(wordmark, glyphs);
			animation_frame = requestAnimationFrame(tick);
		} else {
			frame = null;
		}
	}

	function animate() {
		if (!animation_frame) animation_frame = requestAnimationFrame(tick);
	}

	function decode() {
		if (prefers_reduced_motion()) return;
		ensure_buffers();
		const { columns, kinds } = wordmark;
		reveal_delays = Float32Array.from(
			kinds,
			(_, index) => ((index % columns) / columns) * SWEEP_MS + Math.random() * FLICKER_MS
		);
		decode_started_at = performance.now();
		animate();
	}

	function warm(event: PointerEvent) {
		if (!card || prefers_reduced_motion()) return;
		ensure_buffers();
		const box = card.getBoundingClientRect();
		const { columns, rows } = wordmark;
		const pointer_column = ((event.clientX - box.left) / box.width) * columns;
		const pointer_row = ((event.clientY - box.top) / box.height) * rows;
		for (let row = 0; row < rows; row++) {
			for (let column = 0; column < columns; column++) {
				const distance = Math.hypot(
					column + 0.5 - pointer_column,
					(row + 0.5 - pointer_row) * ROW_STRETCH
				);
				const warmth = 1 - distance / HEAT_RADIUS_COLUMNS;
				const index = row * columns + column;
				if (warmth > heat[index]) heat[index] = warmth;
			}
		}
		animate();
	}

	function shuffle() {
		shuffles += 1;
		decode();
	}

	$effect(() => {
		if (!card) return;
		const observer = new IntersectionObserver(
			(entries) => {
				is_in_view = entries.some((entry) => entry.isIntersecting);
			},
			{ threshold: 0.6 }
		);
		observer.observe(card);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(animation_frame);
		};
	});

	// Decode when the wordmark comes into view, and again on a new page if it's on screen.
	let decoded_path = '';
	$effect(() => {
		const path = page.url.pathname;
		if (!is_in_view || path === decoded_path) return;
		decoded_path = path;
		untrack(decode);
	});

	$effect(() => {
		if (!is_in_view) return;
		const interval = setInterval(
			() => (now = Date.now()),
			prefers_reduced_motion() ? REDUCED_MOTION_COUNTER_MS : COUNTER_MS
		);
		return () => clearInterval(interval);
	});
</script>

<button
	type="button"
	class="ascii-wordmark"
	aria-label="Shuffle the Syntax logo"
	onclick={shuffle}
	onpointerdown={warm}
	onpointermove={warm}
>
	<span class="collage" aria-hidden="true">
		<Collage {seed} width={1100} height={300} />
	</span>
	<span class="card" bind:this={card} style:--columns={wordmark.columns} aria-hidden="true">
		<span class="layer field">{layers.field}</span>
		<span class="layer trace">{layers.trace}</span>
		<span class="layer letter">{layers.letter}</span>
		<span class="layer caption">{layers.caption}</span>
	</span>
</button>

<style>
	.ascii-wordmark {
		position: relative;
		isolation: isolate;
		display: block;
		width: min(100% - 2 * var(--layout-padding, var(--padding, 2rem)), 860px);
		margin: 3rem auto 2.5rem;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;

		/* A sideways finger drag draws the glow trail; vertical drags still scroll. */
		touch-action: pan-y;
	}

	.ascii-wordmark:focus-visible {
		outline: 3px solid var(--c-yellow);
		outline-offset: 1.5rem;
	}

	.collage {
		position: absolute;
		inset: -11% -3% -5% -6%;
		z-index: -1;
		rotate: 1.5deg;
	}

	.card {
		container-type: inline-size;
		display: grid;
		background: var(--c-black);
		rotate: -1deg;
		box-shadow: 0 0.75rem 1.5rem rgb(from var(--c-black) r g b / 0.35);
	}

	.layer {
		grid-area: 1 / 1;
		white-space: pre;
		text-align: start;

		/* Every glyph is 0.6em wide, so this fits the grid to the card exactly. */
		font-size: calc(100cqi / (var(--columns, 74) * 0.6));
		line-height: 1.3;
		letter-spacing: 0;
		font-variant-ligatures: none;
		font-feature-settings:
			'liga' 0,
			'calt' 0;
		user-select: none;
	}

	.letter,
	.trace,
	.caption {
		color: var(--c-yellow);
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}

	/* Side by side, █ glyphs leave hairline seams; a sliver of shadow fills them. */
	.letter {
		text-shadow: 0.05em 0 currentcolor;
	}

	.field {
		color: var(--c-yellow-6);
	}
</style>
