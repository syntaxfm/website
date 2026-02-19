<script lang="ts">
	import Dot from '$lib/utilities/Dot.svelte';
	import no_thumb from './no_thumb.png';

	interface Props {
		show: {
			title: string;
			date: Date;
			show: string;
			thumbnail: string;
			number: number;
		};
		type: 'grid' | 'list';
	}

	let { show, type }: Props = $props();
</script>

<article
	class={[type === 'list' ? 'flex bg-shade-or-tint-light show-list-view' : 'show-grid-view']}
>
	<div>
		<img
			class={[type === 'list' ? 'br-small' : 'br-medium']}
			style={type === 'list' ? 'width: 135px;' : 'width: 100%'}
			src={show.thumbnail || no_thumb}
			alt={show.title}
		/>
	</div>
	<div class={['stack', type === 'grid' && 'stack-reverse']}>
		<h3 class="fs-body fv-700-i">{show.title}</h3>
		<div class="flex">
			{#if type === 'list'}
				<p class="fs-caption">
					{show.date.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}
				</p>
			{/if}
			<Dot color="var(--c-primary)" />
			<p class="fs-caption">{show.show}</p>
			<p class="fs-caption">{show.number}</p>
		</div>
	</div>
</article>

<style>
	.show-list-view {
		border-radius: var(--br-medium);
		padding: 8px;
	}

	.show-grid-view {
		max-width: 300px;

		img {
			margin-bottom: 0.5rem;
		}
	}

	.flex {
		align-items: center;
	}
</style>
