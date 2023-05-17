<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ shows } = data);
</script>

{#each shows as show (show.id)}
	<a href="shows/{show.number}/{show.slug}">
		{show.title}
	</a>
{/each}
