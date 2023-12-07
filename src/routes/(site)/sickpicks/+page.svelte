<script>
	export let data;
</script>

<main>
	<div style:margin-bottom="2rem">
		<h2 class="h3">Sick Picks</h2>
		<p class="text-xs">(things we pick that are sick)</p>
		{#each data.sickPicks as show}
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
