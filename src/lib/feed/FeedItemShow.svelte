<script lang="ts">
	import type { Show } from '@prisma/client';
	import Dot from '$/icons/Dot.svelte';
	import TagRow from '../tags/TagRow.svelte';

	type Props = {
		show: Show;
	};

	const { show }: Props = $props();
</script>

<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<article>
	<div>
		<h3>{show.name}</h3>
		<p><Dot /> 4 Hours Ago</p>
	</div>
	<div>GUESTS</div>
	<div>
		<span class="number fv-700-i">#{show.number}</span>
		{#if show.thumbnail}
			<img src={show.thumbnail} alt={show.title} />
		{:else}
			DEFAULT AUDIO THUMBNAIL
		{/if}
	</div>
	<h4>{show.title}</h4>
	<p>{show.aiShowNote?.description}</p>
	<TagRow tags={show.aiShowNote.topics.map((topic) => topic.name)} />
</article>

<style>
	img {
		border-radius: 20px;
		border: solid 12px var(--c-primary);
		width: 100%;
	}

	.number {
		font-size: 160px;
		color: var(--c-primary);
		margin: 0;
		line-height: 0;
		display: block;
		text-align: right;
	}
</style>
