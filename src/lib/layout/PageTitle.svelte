<script lang="ts">
	import Icon from '../Icon.svelte';
	import TagRow from '../tags/TagRow.svelte';
	import { string_hash } from '$lib/utils/string_hash';

	const {
		type,
		title,
		tags = [],
		date = '',
		show_name = '',
		youtube_url = ''
	}: {
		type: 'SIMPLE' | 'CRAZY' | 'NORMAL';
		date?: string;
		title: string;
		tags?: string[];
		show_name?: string;
		youtube_url?: string;
	} = $props();

	// Procedural-but-fixed collage highlight: a stable hash of the title seeds a
	// per-episode tilt so every title's marker strips look hand-placed yet render
	// identically on server and client and work at any length.
	const TILTS = ['-2.4deg', '-1.5deg', '1.4deg', '2.1deg', '-1.2deg'];
	const seed = $derived(string_hash(title));
	const tilt = $derived(TILTS[seed % TILTS.length]);
	const mark_variant = $derived(seed % 3);
</script>

<header class="title-type-{type} stack">
	{#if youtube_url}
		<a class="youtube-cta" href={youtube_url} target="_blank" rel="noopener">
			<Icon name="youtube" />
			<span><span class="link-text">View on YouTube</span> to comment and like!</span>
		</a>
	{/if}
	<p class="flex">
		{date}
		<span class="primary"><Icon name="close" /></span>
		{show_name}
	</p>
	<h1 class="fv-700-i" style:--transition-name="show-title-{title}" style:--tilt={tilt}>
		<span class="mark" data-variant={mark_variant}>{title}</span>
	</h1>
	<TagRow {tags} />
</header>

<style>
	.title-type-NORMAL h1 {
		width: fit-content;
		rotate: var(--tilt, -1.5deg);
		/* Airy leading so each line's marker strip stays a separate cut-paper piece
		   (with a dark gap between) instead of merging into one block. */
		line-height: 1.5;
	}

	/* Per-line marker strips that hug the text at any length/line count. The cut-paper
	   edge is a few big angular facets (low frequency, not busy) confined to the
	   vertical padding so glyphs are never clipped; the seeded tilt + facet variant
	   make each episode look hand-placed. */
	.title-type-NORMAL .mark {
		background: var(--c-primary);
		color: var(--c-black);
		padding: 0.16em 0.45em;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		-webkit-mask-image: var(--mark-mask);
		mask-image: var(--mark-mask);
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
	}

	.title-type-NORMAL .mark[data-variant='0'] {
		--mark-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 36' preserveAspectRatio='none'%3E%3Cpath d='M0,4L38,1L72,5L100,2L100,33L66,35L33,31L0,34Z' fill='%23fff'/%3E%3C/svg%3E");
	}

	.title-type-NORMAL .mark[data-variant='1'] {
		--mark-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 36' preserveAspectRatio='none'%3E%3Cpath d='M0,2L34,5L70,1L100,4L100,35L64,31L30,35L0,32Z' fill='%23fff'/%3E%3C/svg%3E");
	}

	.title-type-NORMAL .mark[data-variant='2'] {
		--mark-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 36' preserveAspectRatio='none'%3E%3Cpath d='M0,5L40,2L74,5L100,3L100,32L68,35L32,32L0,35Z' fill='%23fff'/%3E%3C/svg%3E");
	}

	.youtube-cta {
		align-self: flex-end;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--c-fg);
		font-variation-settings: var(--fv-700);
		text-decoration: none;
	}

	.youtube-cta .link-text {
		text-decoration: underline;
	}

	.youtube-cta :global(.icon) {
		color: var(--c-red);
	}

	.youtube-cta::after {
		content: none;
	}

	header :global(svg) {
		stroke-width: 4px;
	}

	.flex {
		align-items: center;
		span {
			display: inline-flex;
			align-items: center;
		}
	}
</style>
