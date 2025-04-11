<script lang="ts">
	import Dot from '$/icons/Dot.svelte';

	interface Props {
		show: {
			title: string;
			date: Date;
			show: string;
			thumbnail: string;
		};
	}

	let { show }: Props = $props();
</script>

<article class="flex bg-shade-or-tint-light">
	<div>
		<img src={show.thumbnail} alt={show.title} />
	</div>
	<div class="flex-column">
		<h3 class="fs-body fv-700-i">{show.title}</h3>
		<div class="flex">
			<p class="fs-caption">
				{show.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
			</p>
			<Dot color="var(--c-primary)" />
			<p class="fs-caption">{show.show}</p>
		</div>
	</div>
</article>

<style>
	article {
		border-radius: 8px;
		padding: 8px;
	}

	.flex {
		align-items: center;
	}

	img {
		width: 135px;
		border-radius: 4px;
	}
</style>
