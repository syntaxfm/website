<script lang="ts">
	import Transcript from '$lib/transcript/Transcript.svelte';
	import type { PageData } from './$types';
	import Dump from './Dump.svelte';

	export let data: PageData;
	$: ({ show } = data);
</script>

{#if show?.aiShowNote}
	<h2>AI Show Notes</h2>
	<Dump data={show?.aiShowNote} />
{/if}
{#if show?.transcript}
	<h2>Transcript</h2>
	<Transcript transcript={show?.transcript} />
{/if}
