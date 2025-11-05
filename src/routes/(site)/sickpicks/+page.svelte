<script lang="ts">
	import Meta from '$lib/meta/Meta.svelte';
	import { get_sick_picks } from './sickpicks.remote.js';
</script>

<Meta title="Sick Picks"></Meta>

<main>
	<div style:margin-bottom="2rem">
		<h2 class="h3">Sick Picks</h2>
		<p>(things we pick that are sick)</p>
		{#each await get_sick_picks() as show}
			<h3 class="h5">
				<a href={`/${show.number}`}>#{show.number}</a>
				{#if show.guests.length}
					w/ {show.guests.join(', ')}
				{/if}
			</h3>
			{@html show.rendered}
		{/each}
	</div>
</main>
