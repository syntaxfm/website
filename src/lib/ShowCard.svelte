<script lang="ts">
	import white_grit from '$assets/whitegrit.png';
	import { player } from '$state/player';
	import { format_show_type } from '$utilities/format_show_type';
	import Icon from './Icon.svelte';
	import { format } from 'date-fns';
	import type { LatestShow } from '$server/ai/queries';
	import Badge from './badges/Badge.svelte';
	import Badges from './badges/Badges.svelte';
	import FacePile from './FacePile.svelte';
	import get_show_path from '$utilities/slug';

	export let show: LatestShow;
	export let display: 'list' | 'card' | 'highlight' = 'card';

	export let heading = 'h4';
	export let show_date = new Date(show.date);
	function format_date(date: Date, baseDate: Date = new Date()) {
		const timeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
		const diff = date.getTime() - baseDate.getTime();
		const days = (diff / (1000 * 60 * 60 * 24)) * -1;
		switch (true) {
			case days < 1:
				return timeFormatter.format(-Math.round(days * 24), 'hour');
			case days < 12:
				return timeFormatter.format(-Math.floor(days), 'day');
			case days < 30:
				return timeFormatter.format(-Math.floor(days / 7), 'week');
			default:
				return format(date, 'MMMM do, yyyy');
		}
	}
	export const aria_key = `show${show.number}-description`;
</script>

<article class={display}>
	<a
		href={get_show_path(show)}
		aria-label="Show #{show.number} posted {format_date(show_date)}, {show.title}"
		aria-describedby={aria_key}
	>
		{#if display === 'list'}
			<button
				data-testid="play-show"
				on:click|preventDefault={() => player.play_show(show)}
				class="play-button"
			>
				<Icon name="play" />
			</button>
		{/if}
		<span style:--transition-name="show-date-{show.number}" class="show-number grit"
			>{show.number}</span
		>

		<div class="details">
			<p class="date" style:--transition-name="show-date-{show.number}">
				{format_show_type(show.date)}
				<span aria-hidden="true">×</span>
				<time datetime={show_date.toDateString()} title={show_date.toDateString()}
					>{format_date(show_date)}</time
				>
			</p>

			<svelte:element
				this={heading}
				data-testid="show-card-title"
				class="h3 show-title"
				style:--transition-name="show-title-{show.number}"
			>
				<span class="spa-ran-wrap">
					{show.title}
				</span>
			</svelte:element>

			{#if show.aiShowNote?.description}
				<p id={aria_key} class="description text-sm">{show.aiShowNote?.description}</p>
			{:else}
				{@const description = show.show_notes?.match(/(.*?)(?=## )/s)?.[0]}
				<p id={aria_key} class="description text-sm">
					{description}
				</p>
			{/if}

			{#if show.aiShowNote?.topics}
				<Badges>
					{#each show.aiShowNote.topics
						.filter((topic) => topic.name.length < 15)
						.slice(0, 4) as topic}
						<Badge>{topic.name.startsWith('#') ? '' : '#'}{topic.name}</Badge>
					{/each}
				</Badges>
			{/if}

			<FacePile
				faces={[
					{ name: 'Wes Bos', github: 'wesbos' },
					{ name: 'Scott Tolinski', github: 'stolinski' },
					...(show.guests || []).map((guest) => ({
						name: guest.Guest.name,
						github: guest.Guest.github || ''
					}))
				]}
			/>

			{#if display === 'highlight' || display === 'card'}
				<div class="buttons">
					<button
						data-testid="play-show"
						class:play={display === 'highlight'}
						on:click|preventDefault={() => player.play_show(show)}
						><Icon name="play" /> Play #{show.number}</button
					>
				</div>
			{/if}
		</div>
	</a>
</article>

<style lang="postcss">
	article {
		--bg: var(--bg-sheet);
		container: show-card / inline-size;
		display: grid;
		padding: 20px;
		background-color: var(--bg);
		background-image: var(--bgGrit);
		position: relative;
		overflow: hidden;
		align-items: start;
		& a {
			color: var(--fg);
			display: block;
			display: flex;
			gap: 10px;
			padding: 5px;
		}

		.details {
			display: grid;
			gap: 1rem;
			& > * {
				margin: 0;
			}
		}

		&:hover {
			background-color: color-mix(in lch, var(--fg), var(--bg) 96%);
		}
		&.card {
			border-radius: var(--brad);
			border: solid var(--border-size) var(--subtle);
		}

		&.highlight {
			--bg: var(--bg-root);
			--fg: var(--fg-root);
			/* background-image: linear-gradient(to top, #00000000, var(--bg)), url('$assets/whitegrit.png');
       */

			border-radius: var(--brad);
			grid-column: 1 / -1;
			background-size: 269px;
			background-repeat: repeat;
			background-position: top center;
			border: solid var(--border-size) var(--black-8);
		}

		&.list {
			border: solid 1px var(--subtle);
			margin-bottom: 20px;
			padding: 20px 0;
			margin-inline: auto;
			@media (--below_med) {
				.description {
					display: none;
				}
				h2 {
					mask-image: none;
					font-style: normal;
				}
			}
		}
	}

	.h3 {
		view-transition-name: var(--transition-name);
		margin: 0;
		font-weight: 600;
		font-size: var(--font-size-lg);
		line-height: 1.2;
	}

	.date {
		font-size: var(--font-size-sm);
		margin: 0;
		font-weight: 500;
		view-transition-name: var(--transition-name);
		width: max-content;
		@media (prefers-color-scheme: dark) {
			background: var(--bg);
		}
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
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		--max-font-size: 15rem;
		--ideal-font-size: 45cqw;
		font-size: clamp(1.5rem, var(--ideal-font-size), var(--max-font-size));
		@media (prefers-color-scheme: dark) {
			--ideal-font-size: 22cqw;
		}
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		z-index: -1;
	}

	@container show-card (width > 600px) {
		.highlight {
			& .h3 {
				font-size: var(--font-size-xl);
			}
		}
		.show-number {
			--max-font-size: 20cqw;
		}
	}
</style>
