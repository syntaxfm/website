<script lang="ts">
	import { page } from '$app/state';
	import PageTitle from '#lib/layout/PageTitle.svelte';
	import Transcript from '#lib/transcript/Transcript.svelte';
	import { chapters_as_topics } from '#lib/videos/video_description.ts';
	import SwaggyNewsletterForm from '#lib/newsletter/SwaggyNewsletterForm.svelte';
	import MostPopularThisWeek from '#lib/sidebar/MostPopularThisWeek.svelte';
	import RelatedContent from '#lib/sidebar/RelatedContent.svelte';
	import TrendingTopics from '#lib/sidebar/TrendingTopics.svelte';
	import { VIDEO_LABEL } from '#lib/shows/show_label.ts';
	import { to_json_ld, video_object_schema } from '#lib/seo/structured_data.ts';
	import VideoBezel from '#lib/videos/VideoBezel.svelte';
	import YoutubeEmbed from '#lib/videos/YoutubeEmbed.svelte';
	import { get_watch_url_from_url } from '#lib/videos/utils.ts';
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

	let topics = $derived(chapters_as_topics(video.description.chapters));

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

		<!-- The same transcript as an episode's, its chapters as the topics -->
		{#if video.passages.length > 0 || topics.length > 0}
			<div>
				<Transcript
					show={player_video}
					passages={video.passages}
					{topics}
					has_speakers={false}
					topic_name="Chapter"
				/>
			</div>
		{/if}
	</section>
	<aside class="stack">
		<RelatedContent content_id={video.content_id} />
		<SwaggyNewsletterForm />
		<MostPopularThisWeek />
		<TrendingTopics />
	</aside>
</div>
