<script lang="ts">
	import Transcript from '#lib/transcript/Transcript.svelte';

	let { data } = $props();
	let { transcript, show } = $derived(data);
</script>

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
