<script lang="ts">
	import Dot from '$lib/utilities/Dot.svelte';
	import no_thumb from '../shows/no_thumb.png';
	import { format } from 'date-fns';
	import type { Show } from '$server/db/schema';

	type Props = {
		show: Show;
		rank: number;
	};
	let { show, rank }: Props = $props();
</script>

<article class="flex">
	<span class="rank fs-caption size">{rank}</span>

	<div class="stack ranked-item-info">
		<p class="fs-body">{show.show} - #{show.number}</p>
		<img src={show?.thumbnail || no_thumb} alt={show.title} />
		<h4 class="fs-body fv-700-i">{show.title}</h4>
		<p class="fs-caption">
			{show.guests.map((guest) => guest.name).join(', ')}
			<Dot />
			{show.hosts.map((host) => host.name).join(', ')}
		</p>
		<p class="fs-micro">
			{format(show.date, 'MMM d, yyyy')}
		</p>
	</div>
</article>

<style>
	.ranked-item-info {
		gap: 5px;
	}

	img {
		border-radius: var(--br-medium);
		width: 100%;
	}

	.flex {
		gap: 20px;
	}

	.rank {
		--size: 32px;

		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--c-primary);
		color: var(--c-black);
		border-radius: var(--size);
	}
</style>
