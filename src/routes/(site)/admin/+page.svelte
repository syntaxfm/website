<script lang="ts">
	import ShowTable from '$lib/ShowTable.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let { next_shows, last_9_shows } = $derived(data);
</script>

<h1 class="h3">Dashboard</h1>

<h2 class="h5">Next Shows</h2>

<ShowTable shows={next_shows} />

<h2 class="h5">Last 9 Shows</h2>
<ShowTable shows={last_9_shows} />
