<script lang="ts">
	import { page } from '$app/state';
	import format_time from '$utilities/format_time';
	import PageTitle from '#lib/layout/PageTitle.svelte';
	import SwaggyNewsletterForm from '#lib/newsletter/SwaggyNewsletterForm.svelte';
	import MostPopularThisWeek from '#lib/sidebar/MostPopularThisWeek.svelte';
	import TrendingTopics from '#lib/sidebar/TrendingTopics.svelte';
	import { VIDEO_LABEL } from '#lib/shows/show_label.ts';
	import { to_json_ld, video_object_schema } from '#lib/seo/structured_data.ts';
	import VideoBezel from '#lib/videos/VideoBezel.svelte';
	import YoutubeEmbed from '#lib/videos/YoutubeEmbed.svelte';
	import { get_watch_url_from_url } from '#lib/videos/utils.ts';
	import { player } from '$state/player';
	import type { PlayerVideo } from '$state/player_utils';

	let { data } = $props();
	let { video } = $derived(data);

	let watch_url = $derived(get_watch_url_from_url(video.youtube_id));
	// Plays in the site's player, like an episode: it keeps going in the player bar after leaving
	let player_video: PlayerVideo = $derived({
		kind: 'VIDEO',
		title: video.title,
		slug: video.slug,
		youtube_url: watch_url
	});

	// Chapter and transcript times
	function play_from(seconds: number) {
		void player.start_show(player_video, seconds);
	}
	let schema_json = $derived(
		to_json_ld(
			video_object_schema(
				{
					youtube_id: video.youtube_id,
					slug: video.slug,
					title: video.title,
					description: data.meta.description ?? '',
					thumbnail: video.thumbnail,
					published_at: video.published_at,
					duration: data.duration,
					view_count: video.view_count,
					tags: video.tags
				},
				page.url.origin
			)
		)
	);
</script>

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json">{schema_json}</svelte:element>
</svelte:head>

<VideoBezel><YoutubeEmbed show={player_video} /></VideoBezel>

<PageTitle
	title={video.title}
	tags={video.tags}
	type="NORMAL"
	date={new Date(video.published_at).toISOString()}
	show_name={VIDEO_LABEL}
	youtube_url={watch_url}
/>

<div class="layout-sidebar">
	<section class="stack">
		{#each video.description.paragraphs as paragraph, index (index)}
			<p>{paragraph}</p>
		{/each}

		{#if video.description.chapters.length > 0}
			<h2 class="h5">Chapters</h2>
			<ol class="times">
				{#each video.description.chapters as chapter (chapter.seconds)}
					<li>
						<button type="button" onclick={() => play_from(chapter.seconds)}
							>{format_time(chapter.seconds)}</button
						>
						{chapter.label}
					</li>
				{/each}
			</ol>
		{/if}

		{#if video.passages.length > 0}
			<h2 class="h5">Transcript</h2>
			<ol class="times">
				{#each video.passages as passage, index (index)}
					<li>
						<button type="button" onclick={() => play_from(passage.start)}
							>{format_time(passage.start)}</button
						>
						<p>{passage.text}</p>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
	<aside class="stack">
		<SwaggyNewsletterForm />
		<MostPopularThisWeek />
		<TrendingTopics />
	</aside>
</div>

<style>
	.times {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: grid;
			grid-template-columns: 5ch 1fr;
			gap: 1rem;
			align-items: baseline;
		}

		p {
			margin: 0;
		}
	}

	.times button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--c-primary);
		font-variant-numeric: tabular-nums;
		text-align: start;
		cursor: pointer;
	}
</style>
