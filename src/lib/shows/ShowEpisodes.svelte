<script lang="ts">
	import Show from './Show.svelte';

	type Props = {
		type: 'grid' | 'list';
		shows: {
			title: string;
			show: string;
			thumbnail: string;
			date: Date;
		}[];
	};

	let { type, shows }: Props = $props();
</script>

{#if type === 'grid'}
	<div class="grid">
		{#each shows as show}
			<Show {show} {type} />
		{/each}
	</div>
{/if}

{#if type === 'list'}
	<div class="stack">
		{#each shows as show}
			<Show {show} {type} />
		{/each}
	</div>
{/if}
