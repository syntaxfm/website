<script lang="ts">
	export let data;
	$: ({ guest } = data);
	$: console.log('guest', guest);
</script>

<h1>{guest.name}</h1>

{#each guest.show as show}
	{show.number}
{/each}
