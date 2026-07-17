<script lang="ts">
	import { resolve } from '$app/paths';
	import Filter from '$lib/forms/Filter.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import ShowNotes from '$lib/shows/ShowNotes.svelte';
	import { get_sick_picks } from './sickpicks.remote.js';

	const shows = await get_sick_picks();
	let search = $state('');
	let filtered_shows = $derived.by(() => {
		const normalized_search = search.trim().toLowerCase();

		if (!normalized_search) return shows;

		return shows.filter(
			(show) =>
				String(show.number).includes(normalized_search) ||
				show.title.toLowerCase().includes(normalized_search) ||
				show.guests.some((guest) => guest.toLowerCase().includes(normalized_search)) ||
				show.picks.some((pick) => pick.toLowerCase().includes(normalized_search))
		);
	});
</script>

<Meta title="Sick Picks"></Meta>

<section class="stack" aria-labelledby="sick-picks-title">
	<header class="stack">
		<h1 id="sick-picks-title" class="h1 fv-700-i">Sick Picks</h1>
		<p class="fs-5">Things we pick that are sick.</p>
	</header>

	<Filter
		id="sick-picks-search"
		label="Search sick picks"
		placeholder="Search by show, guest, or pick"
		bind:value={search}
	/>

	{#each filtered_shows as show (show.number)}
		<article class="stack">
			<header>
				<h2 class="h4">
					<a href={resolve(`/${show.number}`)}>
						<span class="primary">#{show.number}</span>
						{show.title}
					</a>
				</h2>
				{#if show.guests.length}
					<p class="fs-caption">with {show.guests.join(', ')}</p>
				{/if}
			</header>

			<ShowNotes show_notes={String(show.rendered)} />
		</article>
	{:else}
		<p>No matching sick picks.</p>
	{/each}
</section>
