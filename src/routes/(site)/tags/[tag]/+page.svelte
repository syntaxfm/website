<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Meta from '$lib/meta/Meta.svelte';
	import get_show_path from '$utilities/slug';
	import { get_content_by_tag } from './tags.remote';

	const tag_slug = (page.params as Record<string, string>).tag ?? '';
	const data = await get_content_by_tag(tag_slug);
</script>

<Meta title={`#${data.tag.name}`} />

<main>
	<h1 class="h3">#{data.tag.name}</h1>

	{#if data.items.length > 0}
		<ul class="stack">
			{#each data.items as item (item.id)}
				<li>
					{#if item.show}
						<a href={resolve(get_show_path(item.show))}>{item.title}</a>
					{:else if item.video}
						<a href={item.video.url} rel="external">{item.title}</a>
					{:else}
						{item.title}
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>No content tagged #{data.tag.name} yet.</p>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	ul {
		list-style: none;
		padding: 0;
	}
</style>
