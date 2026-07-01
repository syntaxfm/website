<script lang="ts">
	import { resolve } from '$app/paths';

	let { name, slug }: { name: string; slug: string | null } = $props();
</script>

{#if slug}
	<a href={resolve(`/tags/${slug}`)} class="tag fs-caption">#{name}</a>
{:else}
	<span class="tag fs-caption">#{name}</span>
{/if}

<style>
	.tag {
		border: solid 1px var(--c-fg-6);
		border-radius: var(--br-small);
		padding: 4px 8px;
		display: inline-block;
		text-transform: lowercase;
		text-decoration: none;
		color: var(--fg);
	}
</style>
