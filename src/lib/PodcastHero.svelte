<script lang="ts">
	import HostsAndGuests from '../routes/shows/[show_number]/[slug]/HostsAndGuests.svelte';
	import Logo from './Logo.svelte';
	import PodcastLinks from './PodcastLinks.svelte';
</script>

<section
	aria-label="Podcast Information Section"
	style:--bg="var(--black)"
	style:--fg="var(--white)"
	class="zone full layout"
>
	<div class="logo">
		<Logo />
	</div>
	<h1 class="h2 text-center">
		A <span class="tasty">Tasty Treats</span> Podcast for Web Developers
	</h1>
	<HostsAndGuests />
	<PodcastLinks />
</section>

<style>
	section {
		background-image: url($assets/whitegrit.png),
			radial-gradient(farthest-side circle at 50% 0%, #3a006b36 4% 4%, #000 100%);
		background-size: 269px, 30%;
		display: grid;
		place-items: center;
	}
	.tasty {
		/* color: var(--yellow); */
	}
	.logo {
		margin: 0 auto;
		width: 50%;
		/* display: none; */
		max-width: 100px;
	}
	h1 {
		text-wrap: balance;
		max-width: 850px;
		margin: 0 auto;
	}
	.zone {
		padding-bottom: 2rem;
	}
</style>
