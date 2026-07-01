<script lang="ts">
	import { resolve } from '$app/paths';
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

{#if prev_show || next_show}
	<nav class="prev-next">
		{#if prev_show}
			<a class="prev" href={resolve(get_show_path(prev_show))}>
				<p class="h3 fv-700-i">← Prev #{prev_show.number}</p>
				<p class="fs-caption">{prev_show.title}</p>
			</a>
		{/if}

		{#if next_show}
			<a class="next" href={resolve(get_show_path(next_show))}>
				<p class="h3 fv-700-i">Next #{next_show.number} →</p>
				<p class="fs-caption">{next_show.title}</p>
			</a>
		{/if}
	</nav>
{/if}

<style lang="postcss">
	.prev-next {
		border-radius: var(--br-medium);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
		border: 2px solid var(--c-fg);

		.prev,
		.next {
			color: inherit;
			text-decoration: none;
		}

		.prev {
			text-align: left;
		}

		/* Only divide the two cells when both are present. */
		.prev:not(:last-child) {
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
