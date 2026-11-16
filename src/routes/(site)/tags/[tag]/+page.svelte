<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import FeedItem from '#lib/feed/FeedItem.svelte';
	import FeedSidebar from '#lib/feed/FeedSidebar.svelte';
	import { topic_anchor } from '#lib/transcript/utils.ts';
	import { get_content_by_tag } from './tags.remote';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// Derived: going from one tag to another (the sidebar's Trending Topics) keeps this page mounted
	let tag_slug = $derived((page.params as Record<string, string>).tag ?? '');
	let tag_data = $derived(await get_content_by_tag(tag_slug));
</script>

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json">{data.schema_json}</svelte:element>
</svelte:head>

<div class="layout-sidebar">
	<section>
		<h1 class="h3">#{tag_data.tag.name}</h1>

		{#if tag_data.key_moments.length > 0}
			<section class="key-moments" aria-labelledby="key-moments-title">
				<h2 id="key-moments-title" class="h5">Key moments</h2>
				<ol>
					{#each tag_data.key_moments as moment (moment.show_number)}
						<li>
							<a
								href="{resolve('/(site)/show/[show_number]/[slug]/transcript', {
									show_number: String(moment.show_number),
									slug: moment.show_slug
								})}#{topic_anchor(moment.text)}">{moment.text}</a
							>
							<small>#{moment.show_number} {moment.show_title} · {moment.time}</small>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		{#if tag_data.items.length > 0}
			<div class="stack">
				{#each tag_data.items as content (content.id)}
					<FeedItem {content} />
				{/each}
			</div>
		{:else}
			<p>No content tagged #{tag_data.tag.name} yet.</p>
		{/if}
	</section>
	<FeedSidebar />
</div>

<style>
	/* Matches the Home feed's spacing under its title */
	.stack,
	p,
	.key-moments {
		margin-top: 1.5rem;
	}

	.key-moments {
		h2 {
			margin: 0 0 0.5rem;
		}

		ol {
			display: grid;
			gap: 0.75rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		li {
			display: grid;
		}

		small {
			color: var(--c-fg-7);
			font-size: var(--fs-1);
		}
	}
</style>
