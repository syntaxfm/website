<script lang="ts">
	export let data;
	$: ({ video } = data);
	$: console.log('video', video);
</script>

<youtube-video controls src="https://www.youtube.com/watch?v={video.id}"></youtube-video>

<h1 class="h3">{video.title}</h1>

<!-- TODO Prunes the description to not show links to syntax.fm or referral links. -->
{@html video.description}

<style lang="postcss">
	youtube-video {
		aspect-ratio: 16 / 9;
	}
</style>
