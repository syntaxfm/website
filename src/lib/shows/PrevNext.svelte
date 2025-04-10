<script lang="ts">
	import get_show_path from '$/utilities/slug.js';
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
				<p class="a">← Prev #{prev_show.number}</p>
				<p class="fs-caption">{prev_show.title}</p>
			</a>
		{/if}
	</div>

	<div class="next">
		{#if next_show}
			<a href={get_show_path(next_show)}>
				<p class="a">Next #{next_show.number} →</p>
				<p class="fs-caption">{next_show.title}</p>
			</a>
		{/if}
	</div>
</nav>

<style lang="postcss">
	.prev-next {
		--border-size: 1px;

		border-radius: var(--brad);
		display: grid;
		gap: var(--border-size);
		grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
		margin-bottom: 1rem;
		border: 1px solid var(--fg);

		.prev {
			text-align: left;
			border-right: 1px solid var(--fg);
		}

		.next {
			text-align: right;
		}

		p {
			margin: 0;
			padding: 0.5rem 1rem;

			&:first-child {
				font-variation-settings: var(--fv-900);
				border-bottom: 1px solid var(--fg);
			}
		}
	}
</style>
