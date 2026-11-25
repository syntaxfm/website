<script lang="ts">
	import PlatformLinks from '#lib/layout/PlatformLinks.svelte';
	import SwaggyNewsletterForm from '#lib/newsletter/SwaggyNewsletterForm.svelte';
	import { PODCAST_PLATFORMS, SOCIAL_PLATFORMS } from '#lib/social/platforms.ts';
</script>

<h1 class="h1 fv-700-i">Links</h1>

<h2 class="h4">Listen</h2>
<PlatformLinks platforms={PODCAST_PLATFORMS} />

<h2 class="h4">Follow</h2>
<PlatformLinks platforms={SOCIAL_PLATFORMS} />

<SwaggyNewsletterForm />

<style>
	h2 {
		margin-top: 2rem;
	}
</style>
