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

	export let show: LatestShow;
	export let display: 'list' | 'card' | 'highlight' = 'card';

	export let heading = 'h3';
	export let show_date = new Date(show.date);
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

<article
	class={display}
	style={display === 'highlight'
		? `background-image:linear-gradient(to top, #00000000, var(--bg)), url(${white_grit})`
		: '--bg=var(--bg-sheet)'}
>
	<a href="/shows/{show.number}/{show.slug}">
		{#if display === 'list'}
			<button on:click|preventDefault={() => player.play_show(show)} class="play-button">
				<Icon name="play" />
			</button>
		{/if}
		<span class="show-number grit">{show.number}</span>

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
				class="h3 show-title"
				style:--transition-name="show-title-{show.number}"
			>
				{show.title}
			</svelte:element>
			{#if show.aiShowNote?.description}
				<p class="description text-sm">{show.aiShowNote?.description}</p>
			{:else}
				<p class="description text-sm">
					{show.show_notes.match(/(.*?)(?=## Show Notes)/s)?.[0]}
				</p>
			{/if}

			{#if show.aiShowNote?.topics}
				<Badges>
					{#each show.aiShowNote.topics
						.filter((topic) => topic.name.length < 15)
						.slice(0, 4) as topic}
						<Badge>#{topic.name}</Badge>
					{/each}
				</Badges>
			{/if}

			<!-- {#if display === 'highlight'}
				<p>
					{show.show_notes.match(/(.*?)(?=## Show Notes)/s)?.[0]}
				</p>
			{/if} -->

			<FacePile
				faces={[
					{ name: 'Wes Bos', github: 'wesbos' },
					{ name: 'Scott Tolinski', github: 'stolinski' },
					...show.guests.map((guest) => ({
						name: guest.Guest.name,
						github: guest.Guest.github || ''
					}))
				]}
			/>

			{#if display === 'highlight' || display === 'card'}
				<div class="buttons">
					<button
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
		container: show-card / inline-size;
		display: grid;
		padding: 20px;
		background-color: var(--bg);
		position: relative;
		overflow: hidden;
		align-items: start;
		& a {
			color: var(--fg);
			display: block;
			display: flex;
			gap: 20px;
		}
		& .buttons {
			/* margin-top: 4rem; */
		}
		.details {
			display: grid;
			gap: 1rem;
			& > * {
				margin: 0;
			}
		}

		&.card {
			border-radius: var(--brad);
			border: solid var(--border-size) var(--black);

			&:hover {
				background-color: var(--zebra);
			}
		}
		.button {
			width: 100%;
		}

		&.highlight {
			--bg: var(--bg-root);
			--fg: var(--fg-root);
			border: none;
			border-radius: var(--brad);
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
		font-weight: 600;
		font-size: var(--font-size-lg);
		line-height: 1.2;
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
		/* top: -1.5rem;
		right: -1.5rem; */
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		font-size: clamp(1.5rem, 45cqw, 15rem);
		font-weight: 900;
		color: var(--yellow);
		line-height: 1;
		z-index: -1;
	}

	.show-type {
		/* background: black;
		color: white; */
	}
</style>
