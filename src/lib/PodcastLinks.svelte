<script lang="ts">
	import { PODCAST_LINKS } from '$const';
</script>

<div>
	{#each PODCAST_LINKS as { text, href }}
		<a
			{href}
			target="_blank"
			class="button subscribe subscribe--{text.toLowerCase().replaceAll(' ', '-')}">{text}</a
		>
	{/each}
</div>

<style lang="postcss">
	div {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
	}

	.subscribe--apple-podcasts {
		--button-bg: linear-gradient(
			to bottom,
			rgb(205, 102, 246) 0%,
			rgb(154, 61, 209) 80%,
			rgb(142, 52, 201) 100%
		);
	}

	.subscribe::before {
		content: '';
		width: 20px;
		height: 20px;
		display: inline-block;
		background-size: cover;
		border-radius: 5px;
		pointer-events: none;
	}

	.subscribe--apple-podcasts::before {
		background-image: url('/icons/itunes.jpg');
	}

	.subscribe--overcast {
		--button-bg: linear-gradient(to bottom, rgb(255, 138, 10) 0%, rgb(255, 105, 48) 100%);
	}
	.subscribe--overcast::before {
		background-image: url('/icons/overcast.jpg');
	}

	.subscribe--rss {
		--button-bg: linear-gradient(
			to bottom,
			rgb(247, 163, 54) 0%,
			rgb(235, 109, 30) 96%,
			rgb(235, 108, 30) 100%
		);
	}
	.subscribe--rss::before {
		background-image: url('/icons/rss.svg');
	}

	.subscribe--spotify {
		--button-bg: linear-gradient(to bottom, rgb(4, 160, 59) 0%, rgb(16, 172, 71) 100%);
	}
	.subscribe--spotify::before {
		background-image: url('/icons/spotify.svg');
	}
	.subscribe--pocketcasts {
		--button-bg: linear-gradient(to bottom, rgb(242, 43, 36) 0%, rgb(215, 12, 11) 100%);
	}
	.subscribe--youtube::before {
		background-image: url('/icons/youtube.svg');
	}
	.subscribe--youtube {
		--button-bg: linear-gradient(to bottom, rgb(255, 255, 255) 0%, rgb(215, 215, 215) 100%);
	}
	.subscribe--pocketcasts::before {
		background-image: url('/icons/pocketcasts.jpg');
	}
	.subscribe--google-podcasts {
		--button-bg: linear-gradient(to bottom, rgb(245, 121, 23) 0%, rgb(254, 185, 90) 100%);
	}
	.subscribe--amazon-music {
		--button-bg: linear-gradient(to bottom, #25d1da 0%, #399a9e 100%);
	}
	.subscribe--google-podcasts::before {
		background-image: url('/icons/google_podcasts.svg');
	}
	.subscribe--amazon-music::before {
		background-image: url('/icons/amznMusic.png');
	}
	a {
		font-size: var(--font-size-xs);
	}
</style>
