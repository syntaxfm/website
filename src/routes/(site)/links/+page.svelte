<script lang="ts">
	import PlatformLinks from '#lib/layout/PlatformLinks.svelte';
	import SwaggyNewsletterForm from '#lib/newsletter/SwaggyNewsletterForm.svelte';
	import { PODCAST_PLATFORMS, SOCIAL_PLATFORMS } from '#lib/social/platforms.ts';
</script>

<div class="column">
	<h1 class="h1 fv-700-i">Links</h1>

	<h2 class="h4">Listen</h2>
	<PlatformLinks platforms={PODCAST_PLATFORMS} is_stacked />

	<h2 class="h4">Follow</h2>
	<PlatformLinks platforms={SOCIAL_PLATFORMS} is_stacked />

	<SwaggyNewsletterForm />
</div>

<style>
	/* A single column of cards, the way people expect a links page to read */
	.column {
		display: grid;
		gap: 1rem;
		max-width: 28rem;
		margin-inline: auto;
	}

	h1,
	h2 {
		margin: 0;
	}

	h2 {
		margin-top: 1.5rem;
	}
</style>
