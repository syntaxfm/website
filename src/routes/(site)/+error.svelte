<script>
	import { page } from '$app/stores';
</script>

<div class="error">
	<h1>Oopsie-daisy</h1>
	{#if $page?.error?.message}
		<p>{$page.error.message}</p>
	{:else}
		<p>Something went wrong. Don't worry, we use Sentry!</p>
	{/if}
</div>
