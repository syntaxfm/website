<script lang="ts">
	import white_grit from '$assets/whitegrit.png';
	import { player } from '$state/player';
	import { format_show_type } from '$utilities/format_show_type';
	import type { Show } from '@prisma/client';
	import { format } from 'date-fns';

	export let show: Show;
	export let highlight = false;
</script>

<article
	class:highlight
	style={highlight
		? `background-image:linear-gradient(to top, #00000000, #000000ff), url(${white_grit})`
		: ''}
>
	<p class="show-card-date">
		{format_show_type(show.date)} - {format(new Date(show.date), 'MMMM do, yyyy')}
	</p>
	<h4>{show.title}</h4>

	{#if highlight}
		<p>
			{show.show_notes.match(/(.*?)(?=## Show Notes)/s)[0]}
		</p>
	{/if}

	<div class="buttons">
		<button class:play={highlight} on:click={() => player.play_show(show)}
			>Play Episode {show.number}</button
		>
		<!-- TODO consider making these links a link and not a button style -->
		<a href={`/shows/${show.number}/${show.slug}`} class="button subtle">Show Notes</a>
	</div>
</article>

<style>
	article {
		container: show-card / inline-size;
		--show-card-color: var(--sheet-color);
		--show-card-bg: var(--sheet-bg);
		display: grid;
		padding: 20px;
		color: var(--show-card-color);
		background-color: var(--show-card-bg);
		border: solid 1px var(--black-3);
		border-radius: 4px;
		&.highlight {
			--show-card-color: var(--sheet-bg);
			--show-card-bg: var(--sheet-color);
			border: none;
			grid-column: 1 / -1;
		}
	}

	h4 {
		line-height: 1.7;
		margin: 0;
		font-weight: 500;
		font-size: var(--font-size-md);
		font-style: italic;
	}

	@container show-card (width > 600px) {
		h4 {
			font-size: var(--font-size-xl);
		}
	}

	.show-card-date {
		font-size: var(--font-size-sm);
		margin: 0;
		opacity: 0.6;
	}

	.buttons {
		margin-top: 4rem;
	}
</style>
