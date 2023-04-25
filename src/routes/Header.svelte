<script lang="ts">
	import { page } from '$app/stores';
	$: console.log('page', $page);
</script>

{#if $page.route.id === '/'}
	<h1>Syntax</h1>
{:else}
	<h2>Syntax</h2>
{/if}
