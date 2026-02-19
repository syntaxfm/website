<script lang="ts">
	import Show from './Show.svelte';

	type Props = {
		type: 'grid' | 'list';
		shows: {
			title: string;
			show: string;
			thumbnail: string;
			date: Date;
			number: number;
		}[];
	};

	let { type, shows }: Props = $props();
</script>

<ul class={type === 'grid' ? 'grid show-episodes' : 'stack show-episodes'}>
	{#each shows as show (show.number)}
		<li>
			<Show {show} {type} />
		</li>
	{/each}
</ul>

<style>
	.show-episodes {
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
