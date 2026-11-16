<script lang="ts">
	import Transcript from '#lib/transcript/Transcript.svelte';

	let { data } = $props();
	let { transcript, show } = $derived(data);
</script>

<svelte:head>
	{#if transcript}
		<!-- The same transcript as Markdown, for AI agents -->
		<link
			rel="alternate"
			type="text/markdown"
			href="/show/{show.number}/{show.slug}/transcript.md"
			title="Transcript as Markdown"
		/>
	{/if}
</svelte:head>

{#if transcript}
	<Transcript
		{show}
		ai_show_note={show.aiShowNote}
		{transcript}
		people_on_show={[
			...show.hosts.flatMap(({ profile }) => profile.name ?? []),
			...show.guests.map(({ guest }) => guest.name)
		]}
	/>
{:else}
	<p>Transcript not available yet! We have the AI robots on the job, check back soon!</p>
{/if}
