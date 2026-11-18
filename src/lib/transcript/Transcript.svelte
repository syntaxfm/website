<script lang="ts">
	import {
		GUEST,
		group_by_topic,
		nearest_passage_id,
		passage_ids,
		topic_anchor,
		type TopicSummary
	} from '#lib/transcript/utils.ts';
	import { onMount } from 'svelte';
	import { audio_timeline_time, player } from '$state/player';
	import format_time, { tsToS } from '$utilities/format_time';
	import Squiggle from './Squiggle.svelte';
	import TableOfContents from './TableOfContents.svelte';

	import { is_same_media, type PlayerItem } from '$state/player_utils';

	// A passage of the transcript, in start order
	type Passage = { transcript: string; start: number; end: number; speakerName?: string };

	interface Props {
		// What plays from a passage's time: the episode, or the video
		show: PlayerItem;
		passages: Passage[];
		// An episode's AI topics, or a video's chapters. The passages are grouped under them.
		topics: TopicSummary[];
		// An episode's AI summary
		description?: string | null;
		// YouTube's captions don't say who's speaking, so a video's passages have no names
		has_speakers?: boolean;
		// What a topic is called: an episode's AI topics, or a video's chapters
		topic_name?: 'Topic' | 'Chapter';
	}

	let {
		show,
		passages,
		topics,
		description = null,
		has_speakers = true,
		topic_name = 'Topic'
	}: Props = $props();

	// Each passage's anchor (#t-<second>), so a link can point at one moment
	let passage_anchors = $derived.by(() => {
		const ids = passage_ids(passages.map((utterance) => utterance.start));
		return passages.map((utterance, index) => ({ utterance, id: ids[index] }));
	});
	let id_by_utterance = $derived(
		new Map(passage_anchors.map(({ utterance, id }) => [utterance, id]))
	);

	// A link made before the transcript was re-run can name a second no passage starts on. It
	// then lands on the passage playing at that second, highlighted as :target would be.
	let linked_passage_id = $state<string | null>(null);

	function follow_outdated_passage_link() {
		linked_passage_id = nearest_passage_id(
			window.location.hash,
			passage_anchors.map(({ utterance, id }) => ({ id, start: utterance.start }))
		);
		if (!linked_passage_id) return;
		const id = linked_passage_id;
		// After the router's own scroll attempt, which finds no element for the old id
		requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
	}

	onMount(follow_outdated_passage_link);

	// Passages before the first AI summary topic, or with no topics at all
	const UNTITLED_TOPIC: TopicSummary = { time: '00:00', text: '' };

	let topic_groups = $derived(
		group_by_topic(passages, topics, tsToS).map((group) => ({
			summary: group.topic ?? UNTITLED_TOPIC,
			utterances: group.utterances
		}))
	);

	// An episode's transcript is on its audio timeline, a video's on its own. Read every frame while it
	// plays. Null while an episode's video with a different timeline plays.
	let current_time = $derived($audio_timeline_time ?? 0);

	let current_utterance = $derived(
		passages.find((utterance, index) => {
			const next_utterance_start = passages[index + 1]?.start || utterance.end;
			return current_time >= utterance.start && current_time <= next_utterance_start;
		})
	);

	let current_topic = $derived(
		topics.find((summary, index) => {
			const next_summary = topics[index + 1];
			const topic_end = next_summary ? tsToS(next_summary.time) : Infinity;
			const topic_start = tsToS(summary.time);
			return current_time >= topic_start && current_time <= topic_end;
		})
	);

	let playing_show_is_this_show = $derived(
		is_same_media($player.current_show, show) && $audio_timeline_time !== null
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

	let label_utterance = $derived(function (utterance: Passage) {
		if (!playing_show_is_this_show) return ''; // not playing this show
		if (utterance === current_utterance) {
			return 'current';
		} else if (current_utterance && current_utterance?.end > utterance.end) {
			return 'past';
		} else {
			return 'future';
		}
	});
	let place_topic = $derived(function (summary: TopicSummary, utterances: Passage[]) {
		const summary_end = utterances.at(-1)?.end || Infinity;
		if (!playing_show_is_this_show) return ''; // not playing this show
		// The same object: chapters have no id to compare
		if (current_topic === summary) {
			return 'current';
		} else if (current_time > summary_end) {
			return 'past';
		} else {
			return 'future';
		}
	});
</script>

<svelte:window onhashchange={follow_outdated_passage_link} />

{#if description}
	<p class="transcript-summary">{description}</p>
{/if}

{#if topics.length > 0}
	<TableOfContents {topics} />
{/if}

<div class="timeline">
	<!-- Two chapters can share a name, so the time is part of the key -->
	{#each topic_groups as { summary, utterances }, i (summary.id ?? `${summary.time} ${summary.text}`)}
		<!-- The anchor is on the section: the gutter it used to be on is hidden on phones -->
		<section id={summary.text ? topic_anchor(summary.text) : undefined}>
			<header class="topic {place_topic(summary, utterances)}">
				<div class="gutter">
					<strong>{topic_name} {i + 1}</strong>
					<!-- Plays from here, like a passage's time -->
					<a
						class="timestamp"
						href={summary.text ? `#${topic_anchor(summary.text)}` : undefined}
						onclick={() => player.play_timestamp(show, tsToS(summary.time))}>{summary.time}</a
					>
				</div>
				<div class="marker">
					<Squiggle top={true} />
					<span class="dot"></span>
					<Squiggle />
				</div>
				<div>
					<h2>{summary.text || 'Transcript'}</h2>
				</div>
			</header>
			<div>
				{#each utterances as utterance (id_by_utterance.get(utterance))}
					{@const progress =
						((current_time - utterance.start) / (utterance.end - utterance.start)) * 100}
					{@const passage_id = id_by_utterance.get(utterance)}
					<div
						id={passage_id}
						style:--progress={progress > 0 && progress < 100 ? `${progress}%` : '100%'}
						class="utterance {label_utterance(utterance)}"
						class:linked={passage_id === linked_passage_id}
					>
						<div class="gutter">
							<!-- A real link, so the moment can be copied and shared; it also plays from there -->
							<a
								class="timestamp"
								href="#{passage_id}"
								onclick={() => player.play_timestamp(show, utterance.start)}
								>{format_time(utterance.start)}</a
							>
							{#if has_speakers}
								<p class="speaker fv-600">
									{utterance.speakerName || GUEST}
								</p>
							{/if}
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

	.transcript-summary {
		font-size: var(--fs-4);
		text-wrap: pretty;
	}

	h2 {
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

		/* A linked passage (#t-1234) lands below the stuck topic header, not under it */
		scroll-margin-top: 160px;

		/* The passage a link points at, highlighted with or without JavaScript. .linked is an
		   outdated link's nearest passage, found with JavaScript. */
		&:target .text,
		&.linked .text {
			background-color: var(--c-yellow-2);
			border-radius: var(--br-small);
		}

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

			.timestamp {
				font-size: inherit;
				font-variation-settings: inherit;
			}
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

		.timestamp {
			color: inherit;
			font-size: var(--fs-2);
			font-variation-settings: var(--fv-700);
			font-variant-numeric: tabular-nums;
			line-height: inherit;
			text-decoration: none;

			&:hover,
			&:focus-visible {
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
