<script lang="ts">
	import { page } from '$app/state';
	import Layout from './(site)/+layout.svelte';
</script>

<!-- Manually render (site) layout around error -->
<Layout>
	<div>
		<h2>Oopsie-daisy</h2>
		{#if page?.error?.message}
			<p class="error">{page.error.message}</p>
		{:else}
			<p class="error">Something went wrong. Don't worry, we use Sentry!</p>
		{/if}
	</div>
</Layout>

<style>
	.error {
		color: var(--c-red);
	}
</style>
