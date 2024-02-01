<script lang="ts">
	import type { PageData } from './$types';
	import Dump from './Dump.svelte';
	export let data: PageData;
	$: ({ show } = data);
</script>

<h1 class="h4">AI Show Notes</h1>
{#if show?.aiShowNote}
	<Dump data={show?.aiShowNote} />
{:else}
	<p>Notes not available</p>
{/if}
