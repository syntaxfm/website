<script lang="ts">
	import TagRow from '../tags/TagRow.svelte';
	import SidebarTitle from './SidebarTitle.svelte';
	import { get_trending_tags } from '../feed/feed.remote';

	const tags = await get_trending_tags();
</script>

{#if tags.length > 0}
	<div>
		<SidebarTitle title="_TRENDING_TOPICS()" />
		<TagRow {tags} />
	</div>
{/if}
