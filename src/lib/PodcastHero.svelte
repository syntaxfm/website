<script lang="ts">
	import { PODCAST_LINKS } from '$const';
	import HostsAndGuests from '../routes/shows/[show_number]/[slug]/HostsAndGuests.svelte';
</script>

<section>
	<h3>A Tasty Treats Podcast for Web Developers</h3>
	<HostsAndGuests />
	<div>
		{#each PODCAST_LINKS as { text, href }}
			<a {href} class="button">{text}</a>
		{/each}
	</div>
</section>
