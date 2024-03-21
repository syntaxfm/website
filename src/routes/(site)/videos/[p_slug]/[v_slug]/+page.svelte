<script lang="ts">
	import ShowCard from '$/lib/ShowCard.svelte';

	export let data;
	$: ({ video } = data);

	function insertBreaks(str: string) {
		return str.replace(/(\d{2}:\d{2})/g, (match, p1, offset) => {
			return offset === 0 ? match : `<br />${match}`;
		});
	}
	function trimAfterHr(htmlString: string) {
		const parts = htmlString.split('<hr>');
		return parts[0].trim();
	}

	function prepare_description(html: string) {
		let description = trimAfterHr(html);
		return insertBreaks(description);
	}
</script>

{#if video}
	<div class="video_page layout full">
		<div class="content">
			<youtube-video controls src="https://www.youtube.com/watch?v={video.id}"></youtube-video>
			<h1 class="h3">{video.title}</h1>
		</div>

		<section class="layout full">
			<div class="main">
				{@html prepare_description(video.description)}
			</div>
			<aside class="sidebar">
				{#if video.shows.length > 0}
					<h2 class="h5">Related Shows</h2>
				{/if}
				{#each video.shows as { show }}
					<ShowCard {show} />
				{/each}
			</aside>
		</section>
	</div>
{/if}

<style lang="postcss">
	.video_page {
		padding: 1rem 0;
	}

	youtube-video {
		border-radius: var(--brad);
		overflow: hidden;
		aspect-ratio: 16 / 9;
		width: 100%;
	}
</style>
