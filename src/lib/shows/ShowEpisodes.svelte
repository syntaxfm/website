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

<div class={type === 'grid' ? 'grid' : 'stack'}>
	{#each shows as show}
		<Show {show} {type} />
	{/each}
</div>
