<script lang="ts">
	import Tag from './Tag.svelte';

	type Props = {
		tags: string[];
	};

	const { tags }: Props = $props();
</script>

<div class="tag-row flex">
	{#each tags as tag}
		<Tag><span>{tag}</span></Tag>
	{/each}
</div>

<style>
	.tag-row {
		flex-wrap: wrap;
	}
</style>
