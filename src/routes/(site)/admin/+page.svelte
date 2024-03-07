<script lang="ts">
	import ShowTable from '$/lib/ShowTable.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ next_shows, last_9_shows } = data);
</script>

<h2 class="h5">Next Shows</h2>

<ShowTable shows={next_shows} />

<h2 class="h5">Last 9 Shows</h2>
<ShowTable shows={last_9_shows} />
