<script lang="ts">
	import NewsletterForm from './NewsletterForm.svelte';
	import NewsletterLogo from './NewsletterLogo.svelte';
	const { count }: { count: string } = $props();
</script>

<div class="newsletter-banner">
	<div class="newsletter-banner-inner stack">
		<NewsletterLogo></NewsletterLogo>
		<p class="center">
			Wanna be one of the <strong>{count}</strong> coolest people in the world?
		</p>
		<NewsletterForm show_logo={false} />
	</div>
</div>

<style>
	.newsletter-banner {
		background: var(--c-primary);
		width: 100vi;
		margin-inline: calc(50% - 50vi);
		.newsletter-banner-inner {
			max-width: 1200px;
			margin: 0 auto;
			align-items: center;
		}
	}
</style>
