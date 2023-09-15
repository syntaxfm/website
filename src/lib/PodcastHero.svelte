<script lang="ts">
	import HostsAndGuests from '../routes/shows/[show_number]/[slug]/[[tab]]/HostsAndGuests.svelte';
	import PodcastLinks from './PodcastLinks.svelte';
</script>

<section
	aria-label="Podcast Information Section"
	style:--bg="var(--black)"
	style:--fg="var(--white)"
	class="zone full layout"
>
	<h1 class="h2">A Tasty Treats Podcast for Web Developers</h1>
	<HostsAndGuests />
	<PodcastLinks />
</section>

<style>
	.zone {
		padding-bottom: 2rem;
	}
</style>
