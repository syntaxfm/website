<script lang="ts">
	import { getSlimUtterances } from '$server/transcripts/utils';
	import { player } from '$state/player';
	import format_time, { tsToS } from '$utilities/format_time';
	import 'core-js/full/map/group-by';
	import slug from 'speakingurl';
	import Squiggle from './Squiggle.svelte';
	import TableOfContents from './TableOfContents.svelte';

	import type { AINoteWithFriends, TranscriptWithUtterances } from '$server/ai/queries';
	import type { SlimUtterance } from '$server/transcripts/types';
	import type { Utterance } from '@deepgram/sdk/dist/types';
	import type { Show } from '@prisma/client';

	export let transcript: TranscriptWithUtterances;
	export let aiShowNote: AINoteWithFriends | null;
	export let show: Show;

	const slim_transcript: SlimUtterance[] = getSlimUtterances(transcript.utterances, 1)
		.filter((utterance) => utterance.speakerId !== 99)
		.filter((utterance) => {
			// Remove the flagging utterances
			const scott = new RegExp(/purple cheese before meeting/gi);
			if (utterance.transcript?.match(scott)) return false;
			if (utterance.transcript.toLowerCase().startsWith('my name is scott')) return false;
			const wes = new RegExp(/my dog eats food ?(?:on)? the moon/i);
			if (utterance.transcript?.match(wes)) return false;
			return true;
		});
	// group Utterances by their summary
	type SummaryTitle = { time: string; text: string; id?: number };
	const def: SummaryTitle = { time: '00:00', text: '' };
	// TODO: This is a type for Map.groupBy(). We can remove this once TypeScript ships the types for it
	type UtteranceMap = Map<typeof def, SlimUtterance[]>;

	const utterances_by_summary: UtteranceMap = Map.groupBy(
		slim_transcript,
		(utterance: Utterance) => {
			const start = utterance.start;
			const summary = aiShowNote?.summary?.findLast((summary, i) => {
				const nextSummary = aiShowNote?.summary?.at(i + 1);
				const end = nextSummary ? tsToS(nextSummary.time) : Infinity;
				const timestamp = tsToS(summary.time);
				return start >= timestamp;
			});
			return summary || def;
		}
	);

	$: currentUtterance = slim_transcript.find((utterance, index) => {
		const nextUtteranceStart = slim_transcript[index + 1]?.start || utterance.end;
		return $player.currentTime >= utterance.start && $player.currentTime <= nextUtteranceStart;
	});

	$: currentTopic = aiShowNote?.summary.find((summary, index) => {
		const nextSummary = aiShowNote?.summary[index + 1];
		const topicEnd = nextSummary ? tsToS(nextSummary.time) : Infinity;
		const topicStart = tsToS(summary.time);
		return $player.currentTime >= topicStart && $player.currentTime <= topicEnd;
	});

	$: playing_show_is_this_show = $player.current_show?.number === transcript.show_number;

	// const words = transcript.utterances
	// 	.map((utt) => utt.words)
	// 	.flat()
	// 	.sort((a, b) => a.start - b.start);

	// $: currentWordIndex = words.findIndex((word, index, words) => {
	// 	const nextWordStart = words[index + 1]?.start || word.end;
	// 	const currentWord = $player.currentTime >= word.start && $player.currentTime <= nextWordStart;
	// 	return currentWord;
	// });

	// let wordCount = 3;
	// $: highlight_words = words
	// 	.slice(
	// 		Math.floor(currentWordIndex / wordCount) * wordCount,
	// 		Math.floor(currentWordIndex / wordCount) * wordCount + wordCount
	// 	)
	// 	.map((word) => word.word)
	// 	.join(' ');

	$: labelUtterance = function (utterance: SlimUtterance) {
		if (!playing_show_is_this_show) return ''; // not playing this show
		if (utterance === currentUtterance) {
			return 'current';
		} else if (currentUtterance && currentUtterance?.end > utterance.end) {
			return 'past';
		} else {
			return 'future';
		}
	};
	$: placeTopic = function (summary: SummaryTitle, utterances: SlimUtterance[]) {
		const summaryEnd = utterances.at(-1)?.end || Infinity;
		if (!playing_show_is_this_show) return ''; // not playing this show
		if (currentTopic?.id === summary.id) {
			return 'current';
		} else if ($player.currentTime > summaryEnd) {
			return 'past';
		} else {
			return 'future';
		}
	};
</script>

{#if aiShowNote}
	<TableOfContents {aiShowNote} />
{/if}

<div class="timeline">
	{#each Array.from(utterances_by_summary) as [summary, utterances], i}
		<section>
			<header class="topic {placeTopic(summary, utterances)}">
				<div class="gutter" id={slug(summary.text)}>
					<strong>Topic {i}</strong>
					<span>{summary.time}</span>
				</div>
				<div class="marker">
					<Squiggle top={true} />
					<span class="dot"></span>
					<Squiggle />
				</div>
				<div>
					<h4>{summary.text || 'Transcript'}</h4>
				</div>
			</header>
			<div>
				{#each utterances as utterance}
					{@const progress =
						(($player.currentTime - utterance.start) / (utterance.end - utterance.start)) * 100}
					<div
						style="
              --progress: {progress > 0 && progress < 100 ? `${progress}%` : '100%'};
              "
						class="utterance {labelUtterance(utterance)}"
					>
						<div class="gutter">
							<button
								class="button-nunya"
								on:click={async () => {
									await player.start_show(show);
									$player.currentTime = utterance.start;
								}}>{format_time(utterance.start)}</button
							>
							<p class="speaker">
								{utterance.speakerName || `Guest ${utterance.speakerId}`}
							</p>
						</div>
						<div class="marker">
							<span class="dot"></span>
						</div>
						<div class="text">
							<p>{utterance.transcript}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style lang="postcss">
	.timeline {
		--highlight: var(--subtle);
		--future: var(--bg-2);
		--current: var(--primary);
		--past: var(--primary);
	}
	.past {
		--highlight: var(--past);
	}
	.current {
		--highlight: var(--primary);
		.marker {
			/* --progress: 50%; */
			background-image: linear-gradient(
				180deg,
				var(--highlight) 0%,
				var(--highlight) var(--progress),
				/* clear Spacer */ var(--bg) calc(var(--progress)),
				var(--bg) calc(var(--progress) + 2px),
				var(--future) calc(var(--progress) + 2px)
			);
		}
	}

	@keyframes pop {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.5);
		}
		100% {
			transform: scale(1);
		}
	}

	header.current {
		--progress: 100%;
	}

	h4 {
		position: sticky;
		top: 0;
		font-size: var(--font-size-md);
		margin: 0;
		z-index: 2;
	}
	.utterance {
		position: relative;
		display: grid;
		grid-template-columns: 120px auto 1fr;
		gap: 0 20px;
		font-size: var(--font-size-xs);
		@media (--below_med) {
			grid-template-columns: 67px 1fr;
			grid-template-rows: auto auto;
			.gutter {
				grid-column: 2;
			}
			.marker {
				grid-column: 1;
				grid-row: 1 / -1;
			}
		}
	}
	.topic {
		--vertical-spacing: 26px; /* must be in px for the SVG */
		--horizonal-spacing: 26px;
		position: relative;

		display: grid;
		grid-template-columns: 95px var(--horizonal-spacing) 1fr;
		place-content: center;
		gap: 20px;
		font-size: var(--font-size-xs);
		position: sticky;
		top: 0;
		background: var(--bg);
		z-index: 2;
		margin-top: var(--vertical-spacing);
		margin-bottom: var(--vertical-spacing);
		.marker {
			place-content: center;
		}
		@media (--below_med) {
			grid-template-columns: var(--horizonal-spacing) 1fr;
			grid-template-rows: auto auto;
			.marker {
				grid-column: 1;
				grid-row: 1 / -1;
			}
			.gutter {
				display: none;
			}
		}
	}
	h4 {
		padding: 1rem 0;
		background: var(--bg);
	}
	.marker {
		position: relative;
		display: grid;
		grid-template-columns: 1fr;
		background: var(--bg-1);
		align-items: start;
		background: linear-gradient(0deg, var(--highlight) 0%, var(--highlight) 50%);
		background-size: 6px 100%;
		background-repeat: repeat-y;
		background-position: center;
		& > * {
			grid-column: 1;
		}
	}
	.gutter {
		position: sticky;
		top: 100px;
		left: 0;
		align-self: start;
		text-align: right;
		transform: translateX(-10px);
		@media (--below_med) {
			display: flex;
			position: relative;
			top: 0;
			width: 100%;
			justify-content: space-between;
		}
		p {
			margin: 0;
		}
	}
	.text {
		p:first-child {
			margin-top: 0;
		}
	}

	.dot {
		--size: 16px;
		display: block;
		width: var(--size);
		height: var(--size);
		position: relative;
		border-radius: 50%;
		border: 1.5px solid var(--bg);
		background: var(--highlight);
		justify-self: center;
		.current & {
			animation: pop 1s 1;
		}
	}

	.timeline {
		--gutter-border-size: 5px;
	}
	.speaker {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--subtle-accent);
	}
</style>
