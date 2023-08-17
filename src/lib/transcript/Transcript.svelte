<script lang="ts">
	import { AINoteWithFriends, TranscriptWithUtterances } from '$server/ai/queries';
	import { getSlimUtterances } from '$server/transcripts/utils';
	import format_time, { tsToS } from '$utilities/format_time';
	import { Prisma } from '@prisma/client';
	import { time } from 'console';
	export let transcript: TranscriptWithUtterances;
	export let aiShowNote: AINoteWithFriends;
	const slim_transcript = getSlimUtterances(transcript.utterances, 1).filter(
		(utterance) => utterance.speakerId !== 99
	);
	console.log(aiShowNote);
</script>

<div>
	{#each slim_transcript as utterance, i}
		{@const summary = aiShowNote?.summary?.find((summary) => {
			const timestamp = tsToS(summary.time);
			if (timestamp >= utterance.start && timestamp <= utterance.end) {
				return summary;
			}
		})}
		<div>
			{#if summary}
				<h4>{summary.text}</h4>
			{/if}
			<strong
				>{utterance.speaker || `Guest ${utterance.speakerId}`} - {format_time(
					utterance.start
				)}</strong
			>
			{utterance.start}
			{utterance.end}
			<p>{utterance.transcript}</p>
		</div>
	{/each}
</div>
