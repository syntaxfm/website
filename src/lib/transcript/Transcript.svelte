<script lang="ts">
	import { getSlimUtterances } from '#lib/transcript/utils.ts';
	import { player } from '$state/player';
	import format_time, { tsToS } from '$utilities/format_time';
	import 'core-js/full/map/group-by';
	import slug from 'speakingurl';
	import Squiggle from './Squiggle.svelte';
	import TableOfContents from './TableOfContents.svelte';

	import type { AINoteWithFriends } from '$server/ai/queries';
	import type { DBUtterance, SlimUtterance } from '$server/transcripts/types';
	import type { SyncPrerecordedResponse } from '@deepgram/sdk';
	import type { PlayerShow } from '$state/player_utils';

	type Utterance = NonNullable<SyncPrerecordedResponse['results']['utterances']>[0];

	interface Props {
		// Utterances in start order (transcript/+page.server.ts)
		transcript: {
			show_number: number;
			utterances: Pick<DBUtterance, 'speaker' | 'start' | 'end' | 'transcript_value'>[];
		};
		ai_show_note: AINoteWithFriends | null;
		show: PlayerShow;
		// Hosts and guests, to name a voice the transcript couldn't
		people_on_show: string[];
	}

	let { transcript, ai_show_note, show, people_on_show }: Props = $props();

	// Derived so moving between two shows' transcripts, which reuses this component, shows the new one
	const slim_transcript: SlimUtterance[] = $derived(
		getSlimUtterances(transcript.utterances, transcript.show_number, true, people_on_show).filter(
			(utterance) => {
				// Remove the flagging utterances
				const scott = new RegExp(/purple cheese before meeting/gi);
				if (utterance.transcript?.match(scott)) return false;
				if (utterance.transcript.toLowerCase().startsWith('my name is scott')) return false;
				const wes = new RegExp(/my dog eats food ?(?:on)? the moon/i);
				if (utterance.transcript?.match(wes)) return false;
				return true;
			}
		)
	);
	// group Utterances by their summary
	type SummaryTitle = { time: string; text: string; id?: number };
	const def: SummaryTitle = { time: '00:00', text: '' };
	// TODO: This is a type for Map.groupBy(). We can remove this once TypeScript ships the types for it
	type UtteranceMap = Map<typeof def, SlimUtterance[]>;

	const utterances_by_summary: UtteranceMap = $derived(
		Map.groupBy(slim_transcript, (utterance: Utterance) => {
			const start = utterance.start;
			const summary = ai_show_note?.summary?.findLast((summary) => {
				const timestamp = tsToS(summary.time);
				return start >= timestamp;
			});
			return summary || def;
		})
	);

	// Transcript times are on the audio timeline. This is null while a video with a different timeline plays.
	let audio_timeline_time = $derived(
		$player.current_show ? player.get_audio_timeline_time() : null
	);
	let current_time = $derived(audio_timeline_time ?? 0);

	let current_utterance = $derived(
		slim_transcript.find((utterance, index) => {
			const next_utterance_start = slim_transcript[index + 1]?.start || utterance.end;
			return current_time >= utterance.start && current_time <= next_utterance_start;
		})
	);

	let current_topic = $derived(
		ai_show_note?.summary.find((summary, index) => {
			const next_summary = ai_show_note?.summary[index + 1];
			const topic_end = next_summary ? tsToS(next_summary.time) : Infinity;
			const topic_start = tsToS(summary.time);
			return current_time >= topic_start && current_time <= topic_end;
		})
	);

	let playing_show_is_this_show = $derived(
		$player.current_show?.number === transcript.show_number && audio_timeline_time !== null
	);

	// const words = transcript.utterances
	// 	.map((utt) => utt.words)
	// 	.flat()
	// 	.sort((a, b) => a.start - b.start);

	// $: currentWordIndex = words.findIndex((word, index, words) => {
	// 	const nextWordStart = words[index + 1]?.start || word.end;
	// 	const currentWord = $player.current_time >= word.start && $player.current_time <= nextWordStart;
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

	let label_utterance = $derived(function (utterance: SlimUtterance) {
		if (!playing_show_is_this_show) return ''; // not playing this show
		if (utterance === current_utterance) {
			return 'current';
		} else if (current_utterance && current_utterance?.end > utterance.end) {
			return 'past';
		} else {
			return 'future';
		}
	});
	let place_topic = $derived(function (summary: SummaryTitle, utterances: SlimUtterance[]) {
		const summary_end = utterances.at(-1)?.end || Infinity;
		if (!playing_show_is_this_show) return ''; // not playing this show
		if (current_topic?.id === summary.id) {
			return 'current';
		} else if (current_time > summary_end) {
			return 'past';
		} else {
			return 'future';
		}
	});
</script>

{#if ai_show_note}
	<TableOfContents {ai_show_note} />
{/if}

<div class="timeline">
	{#each Array.from(utterances_by_summary) as [summary, utterances], i (summary.text)}
		<section>
			<header class="topic {place_topic(summary, utterances)}">
				<div class="gutter" id={slug(summary.text)}>
					<strong>Topic {i + 1}</strong>
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
				{#each utterances as utterance (utterance.start)}
					{@const progress =
						((current_time - utterance.start) / (utterance.end - utterance.start)) * 100}
					<div
						style:--progress={progress > 0 && progress < 100 ? `${progress}%` : '100%'}
						class="utterance {label_utterance(utterance)}"
					>
						<div class="gutter">
							<button onclick={() => player.play_timestamp(show, utterance.start)}
								>{format_time(utterance.start)}</button
							>
							<p class="speaker fv-600">
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
		/* Foreground tints, so the line stays visible on a dark page too */
		--highlight: var(--c-fg-1);
		--future: var(--c-fg-2);
		--current: var(--c-primary);
		--past: var(--c-primary);
		--gutter-border-size: 5px;
	}

	.past {
		--highlight: var(--past);
	}

	.marker {
		position: relative;
		display: grid;
		grid-template-columns: 1fr;
		align-items: start;
		background: linear-gradient(0deg, var(--highlight) 0%, var(--highlight) 50%);
		background-size: 6px 100%;
		background-repeat: repeat-y;
		background-position: center;

		& > * {
			grid-column: 1;
		}
	}

	.current {
		--highlight: var(--c-primary);

		.marker {
			/* --progress: 50%; */
			background-image: linear-gradient(
				180deg,
				var(--highlight) 0%,
				var(--highlight) var(--progress),
				/* clear Spacer */ var(--c-bg) calc(var(--progress)),
				var(--c-bg) calc(var(--progress) + 2px),
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
		font-size: var(--fs-5);
		font-variation-settings: var(--fv-700-italic);
		text-wrap: balance;
		margin: 0;
		z-index: 2;
		padding: 1rem 0;
	}

	.utterance {
		position: relative;
		display: grid;
		grid-template-columns: 120px auto 1fr;
		gap: 0 20px;
		font-size: var(--fs-2);

		@media (--below-med) {
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

		display: grid;
		grid-template-columns: 95px var(--horizonal-spacing) 1fr;
		place-content: center;
		gap: 20px;
		font-size: var(--fs-2);
		position: sticky;
		top: 0;
		/* The page's speckled paper, so the stuck header doesn't read as a solid band. The page sets
		   no color under its specks, so it shows the browser's own (Canvas). */
		background-color: Canvas;
		background-image: var(--texture-speckle);
		background-size: var(--texture-speckle-size);
		z-index: 2;
		margin-top: var(--vertical-spacing);
		margin-bottom: var(--vertical-spacing);

		.marker {
			place-content: center;
		}

		/* "Topic 12 01:02:03" stays on one line, overflowing left into the margin if it must */
		.gutter {
			position: static;
			display: flex;
			justify-content: flex-end;
			gap: 6px;
			align-self: center;
			font-size: var(--fs-1);
			white-space: nowrap;
		}

		@media (--below-med) {
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

	.gutter {
		position: sticky;
		top: 100px;
		left: 0;
		align-self: start;
		text-align: right;
		transform: translateX(-10px);

		@media (--below-med) {
			display: flex;
			align-items: baseline;
			gap: 10px;
			position: relative;
			top: 0;
			width: 100%;
			text-align: left;
			transform: none;
		}

		p {
			margin: 0;
		}

		button {
			padding: 0;
			background: none;
			color: inherit;
			font-size: var(--fs-2);
			font-variation-settings: var(--fv-700);
			font-variant-numeric: tabular-nums;
			line-height: inherit;

			&:hover {
				background: none;
				color: var(--c-primary);
			}
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
		border: 1.5px solid var(--c-bg);
		background: var(--highlight);
		justify-self: center;

		.current & {
			animation: pop 1s 1;
		}
	}

	.speaker {
		font-size: var(--fs-2);
		color: var(--c-black-1-accent, currentcolor);
	}
</style>
