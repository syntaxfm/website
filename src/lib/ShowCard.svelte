<script lang="ts">
	import { player } from '$state/player';
	import { format_show_type } from '$utilities/format_show_type';
	import get_show_path from '$utilities/slug';
	import type { Show } from '@prisma/client';
	import { format } from 'date-fns';
	import FacePile from './FacePile.svelte';
	import Icon from './Icon.svelte';
	import Badge from './badges/Badge.svelte';
	import Badges from './badges/Badges.svelte';

	// Scott - I hand wrote this type to be exactly what this component needs. Lots of TS errors
	// Due to what generated type we're asking to satisfy here
	export let show: Show & {
		aiShowNote?: {
			description?: string;
			topics?: {
				name: string;
			}[];
		} | null;
		guests?: {
			Guest: {
				name: string;
				github: string | null;
			};
		}[];
	};
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
				on:click|preventDefault={() => player.start_show(show)}
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
				<time datetime={show_date.toISOString()}>{format_date(show_date)}</time
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
				<p id={aria_key} class="description text-sm"><span>{show.aiShowNote?.description}</span></p>
			{:else}
				{@const description = show.show_notes?.match(/(.*?)(?=## )/s)?.[0]}
				<p id={aria_key} class="description text-sm">
					<span>{description}</span>
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

			<div class="bottom-row">
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
						on:click|preventDefault={() => player.start_show(show)}
						><Icon name="play" /> Play #{show.number}</button
					>
				</div>
			{/if}
			</div>

		</div>
	</a>
</article>

<style lang="postcss">
	article {
		--bg: var(--bg-1);
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
			display: flex;
			gap: 10px;
			height: 100%;
		}

		.details {
			display: grid;
			flex-grow: 1;
			grid-template-rows: auto auto 1fr auto auto;
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
		}

		.description {
			span {
				/* helps a11y when light text overlaps show number */
				background-color: color-mix(in lch, var(--bg), transparent 50%);				
			}
		}

		/* readability improvements for mobile viewports */
		@media (--below_med) {
			padding: 10px;

			.details {
				/* since we're hiding the description row at these dimensions (which was 100% height), 
				   need a new row to become 100% height -- the show title */
				grid-template-rows: auto 1fr auto auto;
			}
			.description {
				display: none;
				mask-image: none;
			}
		}

		.bottom-row {
			align-self: end;

			/* lay out horizontally */
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1rem;

			.buttons {
				text-align: right;
				align-self: center;
			}
		}

	}

	.h3 {
		view-transition-name: var(--transition-name);
		margin: 0;
		font-weight: 600;
		font-size: var(--font-size-lg);
		line-height: 1.2;
		text-shadow:
			1px 0 0 var(--bg),
			0 1px 0 var(--bg),
			-1px 0 0 var(--bg),
			0 -1px 0 var(--bg);
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
		/* adds contrast when light text overlaps show number */
		text-shadow: 2px 1px 0px var(--bg);
	}

	.play-button {
		background: transparent;
		border-radius: 50%;
		align-self: center;
		border-width: 1px;
		padding: 10px;
		box-shadow: inset 0 0 0 2px color-mix(in lch, var(--fg) 50%, transparent 94%);
		color: var(--fg);
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

		@media (--below_med) {
			--max-font-size: 8rem;
		}
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
