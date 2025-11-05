<script lang="ts">
	import get_show_path from '$utilities/slug.js';
	let {
		prev_show,
		next_show
	}: {
		prev_show:
			| {
					number: number;
					title: string;
					slug: string;
			  }
			| undefined;
		next_show:
			| {
					number: number;
					title: string;
					slug: string;
			  }
			| undefined;
	} = $props();
</script>

<nav class="prev-next">
	<div class="prev">
		{#if prev_show}
			<a href={get_show_path(prev_show)}>
				<p class="h3 fv-700-i">← Prev #{prev_show.number}</p>
				<p class="fs-caption">{prev_show.title}</p>
			</a>
		{/if}
	</div>

	<div class="next">
		{#if next_show}
			<a href={get_show_path(next_show)}>
				<p class="h3 fv-700-i">Next #{next_show.number} →</p>
				<p class="fs-caption">{next_show.title}</p>
			</a>
		{/if}
	</div>
</nav>

<style lang="postcss">
	.prev-next {
		border-radius: var(--br-medium);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
		border: 2px solid var(--c-fg);

		.prev {
			text-align: left;
			border-right: 2px solid var(--c-fg);
		}

		.next {
			text-align: right;
		}

		p {
			margin: 0;
			padding: 0.5rem 1rem;

			&:first-child {
				border-bottom: 2px solid var(--c-fg);
			}
		}
	}
</style>
