<script lang="ts">
	// ? What is this
	// A popover based drop down menu. Less specific than the Select Menu
	// This uses slots instead of props
	import { anchor } from '$actions/anchor';
	import type { Snippet } from 'svelte';
	let {
		children,
		button,
		popover_id
	}: {
		children: Snippet;
		button: Snippet;
		popover_id: string;
	} = $props();
</script>

<div class="dropdown-menu">
	<button
		popovertarget={popover_id}
		class="dropdown-button button-reset"
		use:anchor={{ id: popover_id, position: ['BOTTOM', 'RIGHT'] }}
	>
		{@render button()}
	</button>
	<div popover id={popover_id} class="dropdown-links">
		{@render children()}
	</div>
</div>

<style lang="postcss">
	.dropdown-menu {
		position: relative;
	}

	[popover] {
		background: var(--c-bg);
		border: solid 1px var(--c-black-7);
		border-radius: 6px;
		color: var(--c-white);
		padding: 10px;
		translate: 0 10px;
	}

	.dropdown-button {
		cursor: pointer;
	}

	.dropdown-links {
		background: var(--c-bg-1);
		box-shadow: inset 0 0 0 1px var(--c-black-1);
		border-radius: var(--br-medium);
		color: var(--c-fg);
		translate: 0 3px;
		position: absolute;
		z-index: 10;
	}
</style>
