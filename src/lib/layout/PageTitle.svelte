<script lang="ts">
	import Icon from '../Icon.svelte';
	import TagRow from '../tags/TagRow.svelte';

	const {
		type,
		title,
		tags = [],
		date = '',
		show_name = ''
	}: {
		type: 'SIMPLE' | 'CRAZY' | 'NORMAL';
		date?: string;
		title: string;
		tags?: string[];
		show_name?: string;
	} = $props();
</script>

<header class="title-type-{type} stack">
	<p class="flex">{date} <span class="primary"><Icon name="close" /></span> {show_name}</p>
	<h1 class="fv-700-i" style:--transition-name="show-title-{title}">{title}</h1>
	<TagRow {tags} />
</header>

<style>
	.title-type-NORMAL h1 {
		background: var(--c-primary);
		padding: 0.5rem 1rem;
		color: var(--c-black);
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
