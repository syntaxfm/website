<script lang="ts">
	import { getSlimUtterances } from '$server/transcripts/utils';
	import format_time, { tsToS } from '$utilities/format_time';
	import 'core-js/full/map/group-by';
	import slugify from '@sindresorhus/slugify';
	import { player } from '$state/player';
	import Squiggle from './Squiggle.svelte';
	import type { SlimUtterance } from '$server/transcripts/types';
	import TableOfContents from './TableOfContents.svelte';

	export let transcript;
	export let aiShowNote;
	const slim_transcript: SlimUtterance[] = getSlimUtterances(transcript.utterances, 1).filter(
		(utterance) => utterance.speakerId !== 99
	);
	// group Utterances by their summary
	const def = { time: '00:00', text: '' };
	type TopicSummary = (typeof aiShowNote.summary)[0];

	const utterances_by_summary: Map = Map.groupBy(slim_transcript, (utterance) => {
		const start = utterance.start;
		const summary = aiShowNote?.summary?.findLast((summary, i) => {
			const nextSummary = aiShowNote?.summary?.at(i + 1);
			const end = nextSummary ? tsToS(nextSummary.time) : Infinity;
			const timestamp = tsToS(summary.time);
			return start >= timestamp;
		});
		return summary || def;
	});

	$: currentUtterance = slim_transcript.find((utterance, index) => {
		const nextUtteranceStart = slim_transcript[index + 1]?.start || utterance.end;
		return $player.currentTime >= utterance.start && $player.currentTime <= nextUtteranceStart;
	});

	$: currentTopic = aiShowNote.summary.find((summary, index) => {
		const nextSummary = aiShowNote.summary[index + 1];
		const topicEnd = nextSummary ? tsToS(nextSummary.time) : Infinity;
		const topicStart = tsToS(summary.time);
		return $player.currentTime >= topicStart && $player.currentTime <= topicEnd;
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

	$: labelUtterance = function (utterance) {
		if (utterance === currentUtterance) {
			return 'current';
		} else if (currentUtterance && currentUtterance?.end > utterance.end) {
			return 'past';
		} else {
			return 'future';
		}
	};
	$: placeTopic = function (summary, utterances) {
		const summaryEnd = utterances.at(-1)?.end || Infinity;
		if (currentTopic?.id === summary.id) {
			return 'current';
		} else if ($player.currentTime > summaryEnd) {
			return 'past';
		} else {
			return 'future';
		}
	};
</script>

<TableOfContents {aiShowNote} />

<div class="timeline">
	{#each Array.from(utterances_by_summary) as [summary, utterances], i}
		<section>
			<header class="topic {placeTopic(summary, utterances)}">
				<div class="gutter">
					<div id={slugify(summary.text)}>
						<strong>Topic {i}</strong>
						<span>{summary.time}</span>
					</div>
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
						class="utterance {labelUtterance(utterance, currentUtterance)}"
					>
						<div class="gutter">
							<div>
								<button
									class="button-nunya"
									on:click={() => ($player.currentTime = utterance.start)}
									>{format_time(utterance.start)}</button
								>
								<p class="speaker">
									{utterance.speaker || `Guest ${utterance.speakerId}`}
								</p>
							</div>
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
		--highlight: var(--bg-2);
		--future: var(--bg-2);
		--current: var(--yellow);
		--past: var(--yellow);
	}
	.past {
		--highlight: var(--past);
	}
	.current {
		--highlight: var(--yellow);
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
		gap: 20px;
		font-size: var(--font-size-xs);
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
		background: white;
		z-index: 2;
		margin-top: var(--vertical-spacing);
		margin-bottom: var(--vertical-spacing);
		.marker {
			place-content: center;
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
		border: 1.5px solid var(--white);
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
		color: var(--purple);
	}
</style>
