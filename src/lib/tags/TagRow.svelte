<script lang="ts">
	import Tag from './Tag.svelte';

	type Props = {
		tags: { name: string; slug: string | null }[];
	};

	const { tags }: Props = $props();
</script>

<div class="tag-row flex">
	{#each tags as tag (tag.name)}
		<Tag name={tag.name} slug={tag.slug} />
	{/each}
</div>

<style>
	.tag-row {
		flex-wrap: wrap;
	}
</style>
