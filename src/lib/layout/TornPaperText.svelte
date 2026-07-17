<script lang="ts">
	import { torn_highlight } from '$actions/torn_highlight';
	import { string_hash } from '$lib/utils/string_hash';

	interface Props {
		text: string;
	}

	const TILTS = ['-2.4deg', '-1.5deg', '1.4deg', '2.1deg', '-1.2deg'];

	const { text }: Props = $props();
	const seed = $derived(string_hash(text));
	const tilt = $derived(TILTS[seed % TILTS.length]);
</script>

<span class="collage" style:--tilt={tilt} {@attach torn_highlight({ text, tilt })}>
	<span class="collage-text">{text}</span>
</span>

<style>
	/* The tilt is present for SSR/no-JS; the action takes over once it mounts. */
	.collage {
		--tilt: inherit;

		position: relative;
		display: inline-block;
		transform: rotate(var(--tilt));
	}

	.collage-text {
		position: relative;
		z-index: 1;
		color: var(--c-black);
		background: var(--c-primary);
		box-decoration-break: clone;
		padding: 0.1em 0;
	}

	.collage:global(.has-collage) .collage-text {
		background: none;
	}

	/* The action creates these SVG elements without Svelte scope attributes. */
	.collage :global(.collage-bg) {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: visible;
		pointer-events: none;
	}

	.collage :global(.collage-bg path) {
		fill: var(--c-primary);
	}
</style>
