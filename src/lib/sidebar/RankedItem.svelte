<script lang="ts">
	import { format } from 'date-fns';
	import no_thumb from '../shows/no_thumb.png';
	import type { RankedContent } from './ranked';

	type Props = {
		item: RankedContent;
		rank: number;
	};
	let { item, rank }: Props = $props();
</script>

<a class="flex ranked-item" href={item.href}>
	<span class="rank fs-caption size">{rank}</span>

	<div class="stack ranked-item-info">
		<p class="fs-body">{item.series}{#if item.number} - #{item.number}{/if}</p>
		<img src={item.thumbnail ?? no_thumb} alt={item.title} />
		<h4 class="fs-body fv-700-i">{item.title}</h4>
		{#if item.people.length > 0}
			<p class="fs-caption">{item.people.join(', ')}</p>
		{/if}
		<p class="fs-micro">
			{format(item.date, 'MMM d, yyyy')}
		</p>
	</div>
</a>

<style>
	.ranked-item {
		color: inherit;
		text-decoration: none;
	}

	.ranked-item:hover h4 {
		text-decoration: underline;
	}

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
