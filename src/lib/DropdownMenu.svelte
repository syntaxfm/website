<script lang="ts">
	import { fade } from 'svelte/transition';
	import { clickOutside } from '../actions/click_outside';
	export let isOpen: boolean = false;

	const toggleDropdown = () => {
		isOpen = !isOpen;
	};

	function handleClickOutside() {
		isOpen = false;
	}
</script>

<div class="dropdown-menu" use:clickOutside on:click-outside={handleClickOutside}>
	<div class="dropdown-button" on:click={toggleDropdown} on:keypress={toggleDropdown}>
		<slot name="dropdown-button" />
	</div>
	{#if isOpen}
		<div class="dropdown-links" transition:fade={{ duration: 200 }}>
			<slot name="dropdown-links" />
		</div>
	{/if}
</div>

<style lang="postcss">
	.dropdown-menu {
		position: relative;
	}

	.dropdown-button {
		cursor: pointer;
	}

	.dropdown-links {
		background: var(--sheet-bg);
		border: solid 1px var(--black-7);
		border-radius: 6px;
		color: var(--white);
		translate: 0px 3px;
		position: absolute;
		z-index: 10;
	}

	:global(.dropdown-links button),
	:global(.dropdown-links .button) {
		background: none;
		text-align: left;
		font-size: var(--font-size-sm);
		box-shadow: none;
		white-space: nowrap;
		&:hover {
			background: var(--zebra);
		}
	}
	:global(div[popover] button.active),
	:global(div[popover] .button.active) {
		background: var(--zebra);
	}
</style>
