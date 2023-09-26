<script lang="ts">
	import white_grit from '$assets/whitegrit.png';
	import { player } from '$state/player';
	import { format_show_type } from '$utilities/format_show_type';
	import Icon from './Icon.svelte';
	import { format } from 'date-fns';
	import type { LatestShow } from '$server/ai/queries';

	export let show: LatestShow;
	export let display: 'list' | 'card' | 'highlight' = 'card';

	export let heading = 'h3';

	function format_date(date: Date, baseDate: Date = new Date()) {
		const timeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
		const diff = date.getTime() - baseDate.getTime();
		// If less than 12 days, show days
		// If less than 30 days, show weeks
		// Otherwise show the date
		const days = Math.floor(diff / (1000 * 60 * 60 * 24)) * -1;
		switch (true) {
			case days < 12:
				return timeFormatter.format(-days, 'day');
			case days < 30:
				return timeFormatter.format(-Math.floor(days / 7), 'week');
			default:
				return format(date, 'MMMM do, yyyy');
		}
	}
</script>

<!--

  1. It should say the type: hasty/tasty/supper
  2. It should say the date, but relative if it's within the last 2 weeks
  3. It should say the title
  4. It should have a play button
  5. AI description. Hash tags?
  6. Avatar of the guest?
 -->
<article
	class={display}
	style={display === 'highlight'
		? `background-image:linear-gradient(to top, #00000000, var(--bg)), url(${white_grit})`
		: '--bg=var(--bg-sheet)'}
>
	<a href={`/shows/${show.number}/${show.slug}`}>
		{#if display === 'list'}
			<button on:click|preventDefault={() => player.play_show(show)} class="play-button">
				<Icon name="play" />
			</button>
		{/if}
		<span class="show-number">{show.number}</span>

		<div class="details">
			<span>{format_show_type(show.date)}</span>
			{#if show.aiShowNote?.topics}
				<div class="topics text-sm">
					{#each show.aiShowNote.topics.slice(0, 2) as topic}
						<span class="topic">#{topic.name}</span>
					{/each}
				</div>
			{/if}

			<p class="date" style:--transition-name="show-date-{show.number}">
				{format_show_type(show.date)} - {format_date(new Date(show.date))}
			</p>

			<svelte:element this={heading} class="h3" style:--transition-name="show-title-{show.number}">
				{show.title}
			</svelte:element>

			<!-- {#if display === 'highlight'}
				<p>
					{show.show_notes.match(/(.*?)(?=## Show Notes)/s)?.[0]}
				</p>
			{/if} -->
			{#if show.aiShowNote?.description}
				<p class="description text-sm">{show.aiShowNote?.description}</p>
			{/if}

			{#if display === 'highlight' || display === 'card'}
				<div class="buttons">
					<button
						class:play={display === 'highlight'}
						on:click|preventDefault={() => player.play_show(show)}
						><Icon name="play" /> Play Episode {show.number}</button
					>
				</div>
			{/if}
		</div>
	</a>
</article>

<style lang="postcss">
	article {
		container: show-card / inline-size;
		display: grid;
		padding: 20px;
		background-color: var(--bg);
		position: relative;
		overflow: hidden;
		& a {
			color: var(--fg);
			display: block;
			display: flex;
			gap: 20px;
		}

		& .buttons {
			margin-top: 4rem;
		}

		&.card {
			border-radius: var(--brad);
			border: solid var(--border-size) var(--black);
			.details {
				display: grid;
				grid-template-rows: auto auto auto;
				.buttons {
					align-self: flex-end;
				}
			}
			&:hover {
				background-color: var(--zebra);
			}
		}

		&.highlight {
			--bg: var(--bg-root);
			--fg: var(--fg-root);
			border: none;
			grid-column: 1 / -1;
			background-size: 169px;
			background-repeat: repeat;
			background-position: top center;
		}

		&.list {
			border-top: solid 1px var(--line);
			padding: 20px 0;

			& .h3 {
				font-size: var(--font-size-base);
			}
			& .buttons {
				margin-top: 1rem;
			}
		}
	}

	.h3 {
		view-transition-name: var(--transition-name);
		margin: 0;
		font-weight: 500;
		font-size: var(--font-size-md);
		/* font-style: italic; */
	}

	@container show-card (width > 600px) {
		.highlight {
			& .h3 {
				font-size: var(--font-size-xl);
			}
		}
	}

	.date {
		font-size: var(--font-size-sm);
		margin: 0;
		opacity: 0.6;
		view-transition-name: var(--transition-name);
	}

	.play-button {
		background: linear-gradient(to right, var(--black-2), var(--black-1));
		border-radius: 50%;
		align-self: center;
		border-width: 1px;
		padding: 10px;
		box-shadow: inset 0 0 0 2px oklch(var(--blacklch) / 0.2);
	}

	.show-number {
		position: absolute;
		top: -1.5rem;
		right: -1.5rem;
		font-size: 10rem;
		font-weight: 900;
		color: var(--yellow);
		line-height: 1;
	}
</style>
