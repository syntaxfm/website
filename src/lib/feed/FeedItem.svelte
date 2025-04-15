<script lang="ts">
	import Dot from '$/icons/Dot.svelte';
	import type { Show } from '@prisma/client';
	import Tag from '../tags/Tag.svelte';

	type Props = {
		show: Show;
	};

	let { show }: Props = $props();
</script>

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
	{#each show.aiShowNote?.topics as topic}
		<Tag>{topic.name}</Tag>
	{/each}
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
