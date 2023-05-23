<script lang="ts">
	import { format_show_type } from '$utilities/format_show_type';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ shows } = data);
</script>

<section>
	{#each shows as show (show.id)}
		<article>
			<a href="shows/{show.number}/{show.slug}">
				<p>
					Episode {show.number} | {format_show_type(show.date)}
				</p>
				<h3 style:--transition-name="show-title-{show.number}">{show.title}</h3>
			</a>
		</article>
	{/each}
</section>

<style>
	h3 {
		view-transition-name: var(--transition-name);
	}
</style>
