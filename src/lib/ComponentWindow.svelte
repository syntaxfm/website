<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	export let Component: typeof SvelteComponent;
</script>

<h4>NewsletterForm</h4>

<div class="window">
	<svelte:component this={Component} />
</div>

<div class="layout full">
	<div class="main">
		<svelte:component this={Component} />
	</div>
	<div class="sidebar">
		<svelte:component this={Component} />
	</div>
	<div class="content">
		<svelte:component this={Component} />
	</div>
	<div class="full zone" style:--bg="var(--black)" style:--color="var(--white)">
		<svelte:component this={Component} />
	</div>
</div>

<style>
	.window {
		resize: both;
		overflow: auto;
		border: var(--border);
	}
</style>
