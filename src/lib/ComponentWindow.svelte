<script lang="ts">
	import type { Component } from 'svelte';
	interface Props {
		Component: Component;
	}

	let { Component }: Props = $props();

	let window_width = $state();
</script>

<h4>NewsletterForm</h4>

<div class="window" bind:clientWidth={window_width}>
	<span>{window_width}</span>
	<Component />
</div>

<div class="layout full">
	<div class="main">
		<Component />
	</div>
	<div class="sidebar">
		<Component />
	</div>
	<div class="content">
		<Component />
	</div>
	<div class="full zone" style:--bg="var(--black)" style:--fg="var(--white)">
		<Component />
	</div>
</div>

<style lang="postcss">
	.window {
		resize: both;
		overflow: auto;
		border: var(--border);
		> span {
			position: absolute;
		}
	}
</style>
