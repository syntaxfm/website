<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';

	export let data;
	$: ({ show } = data);
</script>

<ShowCard {show} />
