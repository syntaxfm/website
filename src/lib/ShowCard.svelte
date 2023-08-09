<script lang="ts">
	import white_grit from '$assets/whitegrit.png';
	import { player } from '$state/player';
	import { format_show_type } from '$utilities/format_show_type';
	import type { Show } from '@prisma/client';
	import Icon from './Icon.svelte';
	import { format } from 'date-fns';

	export let show: Show;
	export let display: 'list' | 'card' | 'highlight' = 'card';
</script>

<article
	class={display}
	style={display === 'highlight'
		? `--bg: var(--black); background-image:linear-gradient(to top, #00000000, var(--bg)), url(${white_grit})`
		: '--bg=var(--bg-sheet)'}
>
	<a href={`/shows/${show.number}/${show.slug}`}>
		{#if display === 'list'}
			<button on:click|preventDefault={() => player.play_show(show)} class="play-button">
				<Icon name="play" />
			</button>
		{/if}
		<div class="show-card-data">
			<p class="show-card-date" style:--transition-name="show-date-{show.number}">
				{format_show_type(show.date)} - {format(new Date(show.date), 'MMMM do, yyyy')}
			</p>
			<h4 style:--transition-name="show-title-{show.number}">{show.title}</h4>

			{#if display === 'highlight'}
				<p>
					{show.show_notes.match(/(.*?)(?=## Show Notes)/s)?.[0]}
				</p>
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
		& a {
			color: var(--color);
			display: block;
			display: flex;
			align-items: center;
			gap: 20px;
		}

		& .buttons {
			margin-top: 4rem;
		}

		&.card {
			border-radius: 4px;
			border: solid 1px var(--black-3);
		}

		&.highlight {
			--color: var(--bg-sheet);
			--bg: var(--color-sheet);
			border: none;
			grid-column: 1 / -1;
		}

		&.list {
			border-top: solid 1px var(--line);
			padding: 20px 0;
			&:hover {
				background-color: var(--zebra);
			}
			& h4 {
				font-size: var(--font-size-base);
			}
			& .buttons {
				margin-top: 1rem;
			}
		}
	}

	h4 {
		view-transition-name: var(--transition-name);
		line-height: 1.7;
		margin: 0;
		font-weight: 500;
		font-size: var(--font-size-md);
		font-style: italic;
	}

	@container show-card (width > 600px) {
		.highlight {
			& h4 {
				font-size: var(--font-size-xl);
			}
		}
	}

	.show-card-date {
		font-size: var(--font-size-sm);
		margin: 0;
		opacity: 0.6;
		view-transition-name: var(--transition-name);
	}

	.play-button {
		background: linear-gradient(to right, var(--black-2), var(--black-1));
		border-radius: 50%;
		border-width: 1px;
		padding: 10px;
		box-shadow: inset 0 0 0 2px oklch(var(--blacklch) / 0.2);
	}
</style>
