<script lang="ts">
	import { player } from '$state/player';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ latest } = data);
</script>

<h2>Latest Show</h2>
<article>
	{latest[0].title}
	<button on:click={() => player.play_show(latest[0])}>Play Episode {latest[0].number}</button>
</article>

<h3>Last 10</h3>

{#each latest as latest_ep}
	<article>
		{latest_ep.title}
		<button on:click={() => player.play_show(latest_ep)}>Play Episode {latest_ep.number}</button>
	</article>
{/each}
