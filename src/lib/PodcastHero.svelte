<script lang="ts">
	import HostsAndGuests from '../routes/shows/[show_number]/[slug]/HostsAndGuests.svelte';
	import PodcastLinks from './PodcastLinks.svelte';
</script>

<section style:--bg="var(--black)" style:--color="var(--white)" class="zone full layout">
	<h3>A Tasty Treats Podcast for Web Developers</h3>
	<HostsAndGuests />
	<PodcastLinks />
</section>

<style>
	.zone {
		padding-bottom: 2rem;
	}
</style>
