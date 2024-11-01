<script lang="ts">
	import Transcript from '$lib/transcript/Transcript.svelte';

	let { data } = $props();
	let { transcript, show } = $derived(data);
</script>

{#if transcript}
	<Transcript {show} aiShowNote={show.aiShowNote} {transcript} />
{:else}
	<p>Transcript not available yet! We have the AI robots on the job, check back soon!</p>
{/if}
