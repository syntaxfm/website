<script lang="ts">
	import { AINoteWithFriends, TranscriptWithUtterances } from '$server/ai/queries';
	import { SlimUtterance, getSlimUtterances } from '$server/transcripts/utils';
	import format_time, { tsToS } from '$utilities/format_time';
	import { Prisma } from '@prisma/client';
	import { time } from 'console';
	import 'core-js/full/map/group-by';
	export let transcript: TranscriptWithUtterances;
	export let aiShowNote: AINoteWithFriends;
	const slim_transcript = getSlimUtterances(transcript.utterances, 1).filter(
		(utterance) => utterance.speakerId !== 99
	);
	// group Utterances by their summary
	const def = { time: '00:00', text: '' };
	const utterances_by_summary: Map<(typeof aiShowNote.summary)[0], SlimUtterance[]> = Map.groupBy(
		slim_transcript,
		(utterance: SlimUtterance) => {
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

	console.log(utterances_by_summary);

	import { player } from '$state/player';
	import Squiggle from './Squiggle.svelte';

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

<div class="timeline">
	{#each Array.from(utterances_by_summary) as [summary, utterances], i}
		<section>
			<header class="topic">
				<div class="gutter">
					<div>
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
					<div class="utterance">
						<div class="gutter">
							<div>
								<span>{format_time(utterance.start)}</span>
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

<style>
	.active {
		background: red;
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
		background: linear-gradient(0deg, var(--purple) 0%, var(--purple) 50%);
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
		& + * {
			/* border-left: var(--gutter-border-size) solid var(--bg-1); */
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
		border-radius: 50%;
		border: 1.5px solid var(--white);
		background: var(--purple);
		justify-self: center;
	}

	.timeline {
		--gutter-border-size: 5px;
		section {
		}
	}
	.speaker {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--purple);
	}
</style>
