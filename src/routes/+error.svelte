<script lang="ts">
	import { page } from '$app/state';
	import Layout from './(site)/+layout.svelte';

	type PageSafeUser = {
		id: string;
		name: string;
		image: string | null;
		roles: string[];
	} | null;

	interface Props {
		// error page does not automatically infer layout data, and SvelteKit 3 renders it without
		// data when rendering itself failed, so fall back to the page's data
		data?: {
			user: PageSafeUser;
			user_theme: string;
		};
	}

	let { data }: Props = $props();
	let user: PageSafeUser = $derived(data?.user ?? page.data.user ?? null);
	let user_theme: string = $derived(data?.user_theme ?? page.data.user_theme ?? 'system');
</script>

<!-- Manually render (site) layout around error -->
<Layout data={{ user: user, user_theme }}>
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
