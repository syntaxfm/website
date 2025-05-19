<script lang="ts">
	import Logo from '$/lib/layout/Logo.svelte';
	import Nav from '$/lib/layout/Nav.svelte';
	import { page } from '$app/state';

	interface Props {
		page_type?: 'landing' | 'interior';
	}

	let { page_type = 'interior' }: Props = $props();
</script>

<header class="layout full">
	{#if page_type === 'interior'}
		<a title="Syntax Podcast Home" href="/">
			<Logo height="95px" />
		</a>
	{:else}
		<Logo height="185px" --logo-color="var(--c-primary)" />
	{/if}
	<Nav />
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;

		--logo-color: light-dark(var(--c-black), var(--c-primary));
	}
</style>
