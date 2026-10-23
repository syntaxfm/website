<script lang="ts">
	import { page } from '$app/state';
	import Layout from './(site)/+layout.svelte';
	import type { UserWithRoles } from '#server/auth/users.js';

	interface Props {
		// error page does not automatically infer layout data...
		data: {
			user: UserWithRoles;
			user_theme: string;
		};
	}

	let { data }: Props = $props();
	let { user, user_theme } = $derived(data);
</script>

<!-- Manually render (site) layout around error -->
<Layout data={{ user, user_theme, latest: [] }}>
	<div>
		<h2>Oopsie-daisy</h2>
		{#if page?.error?.message}
			<p class="error">{page.error.message}</p>
		{:else}
			<p class="error">Something went wrong. Don't worry, we use Sentry!</p>
		{/if}
		{#if page?.error?.error_id}
			<p class="error-id">Error ID: <code>{page.error.error_id}</code></p>
		{/if}
	</div>
</Layout>

<style>
	.error {
		color: var(--warning);
	}
</style>
