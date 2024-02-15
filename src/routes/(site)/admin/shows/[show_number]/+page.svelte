<script lang="ts">
	import type { PageData } from './$types';
	import Dump from './Dump.svelte';
	export let data: PageData;
	$: ({ show } = data);
</script>

<h1 class="h4">DB dump</h1>
<p>This is the data that is currently in the DB. No caches.</p>
{#if show}
	<Dump data={show} />
{/if}
<h1 class="h4">AI Show Notes</h1>

{#if show?.aiShowNote}
	<Dump data={show?.aiShowNote} />
{:else}
	<p>Notes not available</p>
{/if}
