<script lang="ts">
	import { AINoteWithFriends, TranscriptWithUtterances } from '$server/ai/queries';
	import { SlimUtterance, getSlimUtterances } from '$server/transcripts/utils';
	import format_time, { tsToS } from '$utilities/format_time';
	import { Prisma } from '@prisma/client';
	import { time } from 'console';
	export let transcript: TranscriptWithUtterances;
	export let aiShowNote: AINoteWithFriends;
	const slim_transcript = getSlimUtterances(transcript.utterances, 1).filter(
		(utterance) => utterance.speakerId !== 99
	);
	import { player } from '$state/player';

	$: currentUtterance = slim_transcript.find((utterance, index) => {
		const nextUtteranceStart = slim_transcript[index + 1]?.start || utterance.end;
		return $player.currentTime >= utterance.start && $player.currentTime <= nextUtteranceStart;
	});

	const words = transcript.utterances
		.map((utt) => utt.words)
		.flat()
		.sort((a, b) => a.start - b.start);

	$: currentWordIndex = words.findIndex((word, index, words) => {
		const nextWordStart = words[index + 1]?.start || word.end;
		const currentWord = $player.currentTime >= word.start && $player.currentTime <= nextWordStart;
		return currentWord;
	});

	let wordCount = 3;
	$: highlight_words = words
		.slice(
			Math.floor(currentWordIndex / wordCount) * wordCount,
			Math.floor(currentWordIndex / wordCount) * wordCount + wordCount
		)
		.map((word) => word.word)
		.join(' ');
</script>

<p><mark>{highlight_words}</mark></p>
<h2>{$player.current_show?.title}</h2>
<h2>{$player.currentTime}</h2>
<p>{words[currentWordIndex]?.word}</p>
<p>{currentUtterance?.transcript}</p>
<p>{currentUtterance?.utteranceIndex}</p>

<div>
	<ul>
		{#each aiShowNote?.summary || [] as summary}
			<li>
				{summary.text} - {tsToS(summary.time)}
			</li>
		{/each}
	</ul>
</div>

<div>
	{#each slim_transcript as utterance, i}
		{@const summary = aiShowNote?.summary?.find((summary) => {
			const timestamp = tsToS(summary.time);
			const lastUtterance = slim_transcript[i - 1];
			const timestamp_between_last_and_next =
				lastUtterance && timestamp >= lastUtterance.end && timestamp <= utterance.start;
			if (
				(timestamp >= utterance.start && timestamp <= utterance.end) ||
				timestamp_between_last_and_next
			) {
				return summary;
			}
		})}
		<div class={utterance === currentUtterance ? 'active' : ''}>
			{#if summary}
				<h4>{summary.text}</h4>
			{/if}
			<strong
				>{utterance.speaker || `Guest ${utterance.speakerId}`} - {format_time(
					utterance.start
				)}</strong
			>

			<p>{utterance.transcript}</p>
		</div>
	{/each}
</div>

<style>
	.active {
		background: red;
	}
</style>
