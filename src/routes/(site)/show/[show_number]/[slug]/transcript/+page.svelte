<script lang="ts">
	import Transcript from '$lib/transcript/Transcript.svelte';

	export let data;
	$: ({ transcript, show } = data);
</script>

{#if transcript}
	<Transcript {show} aiShowNote={show.aiShowNote} {transcript} />
{:else}
	<p>Transcript not available yet! We have the AI robots on the job, check back soon!</p>
{/if}
