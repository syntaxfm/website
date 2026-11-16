<script lang="ts">
	import { page } from '$app/state';
	import GuestHero from '#lib/guest/GuestHero.svelte';
	import FeedItem from '#lib/feed/FeedItem.svelte';
	import SwaggyNewsletterForm from '#lib/newsletter/SwaggyNewsletterForm.svelte';
	import TrendingTopics from '#lib/sidebar/TrendingTopics.svelte';
	import { get_guest, get_guest_feed } from '../guests.remote';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const guest = await get_guest(page.params.name_slug!);
	const feed = await get_guest_feed(page.params.name_slug!);
</script>

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json">{data.schema_json}</svelte:element>
</svelte:head>

{#if guest}
	<GuestHero {guest} />

	<section class="layout-sidebar guest-feed">
		<div class="feed">
			<h2 class="visually-hidden">Episodes with {guest.name}</h2>
			<div class="stack">
				{#each feed as content (content.id)}
					<FeedItem {content} />
				{/each}
			</div>
		</div>

		<aside class="stack">
			<TrendingTopics />
			<SwaggyNewsletterForm />
		</aside>
	</section>
{/if}

<style lang="postcss">
	.guest-feed {
		padding-block: 3rem 4rem;
	}
</style>
