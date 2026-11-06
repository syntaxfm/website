<script lang="ts">
	import { resolve } from '$app/paths';
	import Filter from '#lib/forms/Filter.svelte';
	import Meta from '#lib/meta/Meta.svelte';
	import ShowNotes from '#lib/shows/ShowNotes.svelte';
	import { on_visible } from '$actions/on_visible';
	import { get_sick_picks } from './sickpicks.remote.js';

	// Rendering every show's picks at once blocked the main thread for over a second
	const SHOWS_PER_BATCH = 20;

	const shows = await get_sick_picks();
	let search = $state('');
	let visible_count = $state(SHOWS_PER_BATCH);
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

	{#each filtered_shows.slice(0, visible_count) as show (show.number)}
		<article class="stack">
			<header>
				<h2 class="h4">
					<a href={resolve(`${show.number}`)}>
						<span class="primary">#{show.number}</span>
						{show.title}
					</a>
				</h2>
				{#if show.guests.length}
					<p class="fs-caption">with {show.guests.join(', ')}</p>
				{/if}
			</header>

			<ShowNotes show_notes={show.notes} />
		</article>
	{:else}
		<p>No matching sick picks.</p>
	{/each}

	{#if visible_count < filtered_shows.length}
		{#key visible_count}
			<div {@attach on_visible(() => (visible_count += SHOWS_PER_BATCH))}></div>
		{/key}
	{/if}
</section>
