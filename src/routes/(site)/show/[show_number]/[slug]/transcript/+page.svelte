<script lang="ts">
	import Transcript from '#lib/transcript/Transcript.svelte';
	import {
		getSlimUtterances,
		people_on_show,
		remove_flagging_utterances
	} from '#lib/transcript/utils.ts';

	let { data } = $props();
	let { transcript, show } = $derived(data);

	// Derived so moving between two shows' transcripts, which reuses the component, shows the new one
	let passages = $derived(
		transcript
			? remove_flagging_utterances(
					getSlimUtterances(
						transcript.utterances,
						show.number,
						true,
						// Hosts and guests, to name a voice the transcript couldn't
						people_on_show(
							show.hosts.flatMap(({ profile }) => profile.name ?? []),
							show.guests.map(({ guest }) => guest.name)
						)
					)
				)
			: []
	);
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
		{passages}
		topics={show.aiShowNote?.summary ?? []}
		description={show.aiShowNote?.description}
	/>
{:else}
	<p>Transcript not available yet! We have the AI robots on the job, check back soon!</p>
{/if}
