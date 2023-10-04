<script lang="ts">
	import { player } from '$state/player';
	import { format_show_type } from '$utilities/format_show_type';
	import { format } from 'date-fns';
	import type { LatestShow } from '$server/ai/queries';
	import Badge from './badges/Badge.svelte';
	import Badges from './badges/Badges.svelte';
	import FacePile from './FacePile.svelte';

	export let show: LatestShow;

	export let heading = 'h3';
	export let show_date = new Date(show.date);
	function format_date(date: Date) {
		return format(date, 'MMMM do, yyyy');
	}
</script>

<article>
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
			class="h1 show-title"
			style:--transition-name="show-title-{show.number}"
		>
			{show.title}
		</svelte:element>

		{#if show.aiShowNote?.topics}
			<Badges>
				{#each show.aiShowNote.topics
					.filter((topic) => topic.name.length < 15)
					.slice(0, 4) as topic}
					<Badge>#{topic.name}</Badge>
				{/each}
			</Badges>
		{/if}

		<FacePile
			size="150px"
			faces={[
				{ name: 'Wes Bos', github: 'wesbos' },
				{ name: 'Scott Tolinski', github: 'stolinski' },
				...(show.guests || []).map((guest) => ({
					name: guest.Guest.name,
					github: guest.Guest.github || ''
				}))
			]}
		/>
		<span class="syntax-url">syntax.fm</span>
	</div>
</article>

<style lang="postcss">
	article {
		container: show-card / inline-size;
		display: grid;
		padding: 20px;
		background-color: var(--bg);
		color: var(--fg);
		position: relative;
		overflow: hidden;
		align-items: start;
		height: 100%;

		.details {
			gap: 1rem;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			height: 100%;
		}
	}

	.h1 {
		view-transition-name: var(--transition-name);
		margin-bottom: 2rem;
		font-weight: 600;
		line-height: 1.2;
	}

	.date {
		font-size: var(--font-size-xl);
		margin: 0;
		opacity: 0.6;
		view-transition-name: var(--transition-name);
	}

	.show-number {
		position: absolute;
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		--max-font-size: 15rem;
		font-size: clamp(1.5rem, 45cqw, var(--max-font-size));
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		z-index: -1;
	}

	@container show-card (width > 600px) {
		.show-number {
			--max-font-size: 20cqw;
		}
	}

	.syntax-url {
		display: block;
		position: absolute;
		font-style: italic;
		font-weight: 600;
		color: var(--black);
		background-color: var(--yellow);
		bottom: 0;
		right: 40px;
		padding: 10px 20px;
		font-size: var(--font-size-xl);
	}
</style>
