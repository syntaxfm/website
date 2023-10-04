<script lang="ts">
	import Logo from './Logo.svelte';
	import PodcastLinks from './PodcastLinks.svelte';
	import Schedule from './schedule.svelte';
</script>

<section
	aria-label="Podcast Information Section"
	style:--bg="var(--black)"
	style:--fg="var(--white)"
	class="zone full layout"
>
	<div class="hero">
		<div class="logo">
			<div><Logo /></div>
		</div>
		<h1 class="h2 text-center">
			A <span class="tasty">Tasty Treats</span> Podcast for Web Developers
		</h1>
		<p class="hosted-by">
			Hosted by <img
				width="50"
				height="50"
				src={`https://github.com/wesbos.png`}
				alt="A rather handsome Wes Bos"
			/><a href="/about">Wes Bos</a>
			<span class="amp">&</span>
			<img
				width="50"
				height="50"
				src={`https://github.com/stolinski.png`}
				alt="Scott lookin absolutely fresh"
			/> <a href="/about">Scott Tolinski</a>
		</p>

		<PodcastLinks />
		<Schedule />
	</div>
</section>

<style lang="postcss">
	section {
		background-image: url($assets/whitegrit.png),
			radial-gradient(farthest-side circle at 50% 0%, #3a006b36 4% 4%, #000 100%);
		background-size: 269px, 30%;
	}
	.hero {
		display: grid;
		place-items: center;
		gap: 20px;
		padding-top: 20px;
		align-content: space-around;
	}
	.tasty {
		/* color: var(--yellow); */
	}
	.logo {
		margin: 0 auto;
		width: 50%;
		max-width: 200px;
	}
	h1 {
		text-wrap: balance;
		max-width: 850px;
		margin: 0 auto;
	}

	.zone {
		padding-bottom: 2rem;
	}

	.hosted-by {
		display: flex;
		width: 100%;
		justify-content: center;
		place-items: center;
		gap: 0.5rem;
		img {
			width: 40px;
			display: inline-block;
			height: auto;
			border-radius: 50%;
		}
		.amp {
			font-size: var(--font-size-xs);
		}
	}
</style>
