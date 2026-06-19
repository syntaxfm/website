<script lang="ts">
	import Icon from '../Icon.svelte';
	import TagRow from '../tags/TagRow.svelte';
	import { string_hash } from '$lib/utils/string_hash';
	import { torn_highlight } from '$actions/torn_highlight';

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

	// A stable hash of the title seeds a per-episode tilt so every title looks
	// hand-placed yet renders identically on server and client.
	const TILTS = ['-2.4deg', '-1.5deg', '1.4deg', '2.1deg', '-1.2deg'];
	const seed = $derived(string_hash(title));
	const tilt = $derived(TILTS[seed % TILTS.length]);
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
	<h1 class="fv-700-i" style:--transition-name="show-title-{title}">
		<span class="collage" style:--tilt={tilt} use:torn_highlight={{ text: title, tilt }}>
			<span class="collage-text">{title}</span>
		</span>
	</h1>
	<TagRow {tags} />
</header>

<style>
	.title-type-NORMAL h1 {
		width: fit-content;
		line-height: 1.75;
	}

	/* Wrapper for the title text + the generated torn-paper SVG behind it. The tilt is
	   here for SSR/no-JS; the action takes over the transform once it mounts. */
	.collage {
		position: relative;
		display: inline-block;
		transform: rotate(var(--tilt, -1.5deg));
	}

	.collage-text {
		position: relative;
		z-index: 1;
		color: var(--c-black);
		/* No-JS / pre-hydration fallback highlight — clean and readable. The action
		   draws the per-line torn SVG and adds .has-collage to hide this. */
		background: var(--c-primary);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		padding: 0.1em 0;
	}

	.collage.has-collage .collage-text {
		background: none;
	}

	/* SVG + paths are created by the action, so they carry no scope hash — style globally. */
	:global(.collage-bg) {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: visible;
		pointer-events: none;
	}

	:global(.collage-bg path) {
		fill: var(--c-primary);
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
