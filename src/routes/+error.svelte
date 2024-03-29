<script lang="ts">
	import { page } from '$app/stores';
	import Layout from './(site)/+layout.svelte';
	import type { UserWithRoles } from '$/server/auth/users';

	// error page does not automatically infer layout data...
	export let data: {
		user: UserWithRoles,
		user_theme: string;
	};
	$: ({ user, user_theme } = data);
</script>

<!-- Manually render (site) layout around error -->
<Layout data={{ user: user, user_theme }}>
	<div>
		<h2>Oopsie-daisy</h2>
		{#if $page?.error?.message}
			<p class="error">{$page.error.message}</p>
		{:else}
			<p class="error">Something went wrong. Don't worry, we use Sentry!</p>
		{/if}
	</div>
</Layout>

<style>
	.error {
		color: var(--warning);
	}
</style>