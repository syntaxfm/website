<script lang="ts">
	import Icon from '../Icon.svelte';
	import TagRow from '../tags/TagRow.svelte';
	import TornPaperText from './TornPaperText.svelte';

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
		tags?: { name: string; slug: string | null }[];
		show_name?: string;
		youtube_url?: string;
	} = $props();
</script>

<header class="title-type-{type} stack">
	{#if youtube_url}
		<a class="youtube-cta" href={youtube_url} target="_blank" rel="noopener external">
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
		<TornPaperText text={title} />
	</h1>
	<TagRow {tags} />
</header>

<style>
	header[class~='title-type-NORMAL'] h1 {
		width: fit-content;
		line-height: 1.75;
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
