<script lang="ts">
	import type { PageData } from './$types';
	import Dump from './Dump.svelte';
	export let data: PageData;
	$: ({ show } = data);
</script>

{#if show?.aiShowNote}
	<h2>AI Show Notes</h2>
	<Dump data={show?.aiShowNote} />
{/if}
