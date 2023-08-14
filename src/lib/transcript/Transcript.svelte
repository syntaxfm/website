<script lang="ts">
	import { type TranscriptSelect } from '$server/ai/queries';
	import format_time from '$utilities/format_time';
	import { Prisma } from '@prisma/client';

	export let transcript: Prisma.TranscriptGetPayload<TranscriptSelect>;
</script>

<div>
	{#each transcript.utterances as utterance}
		<div>
			<strong
				>{utterance.speakerName || `Guest ${utterance.speaker}`} - {format_time(
					utterance.start
				)}</strong
			>
			<p>{utterance.transcript_value}</p>
		</div>
	{/each}
</div>
