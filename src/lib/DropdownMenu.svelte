<script lang="ts">
	import { fade } from 'svelte/transition';
	import { clickOutside } from '../actions/click_outside';
	import { anchor } from '$actions/anchor';
	export let isOpen: boolean = false;

	let popover_id = 'user-menu';

	const toggleDropdown = () => {
		isOpen = !isOpen;
	};

	function handleClickOutside() {
		isOpen = false;
	}
</script>

<div class="dropdown-menu" use:clickOutside on:click-outside={handleClickOutside}>
	<button
		popovertarget={popover_id}
		class="dropdown-button button-reset"
		use:anchor={{ id: popover_id, position: ['BOTTOM', 'RIGHT'] }}
		on:click={toggleDropdown}
		on:keypress={toggleDropdown}
	>
		<slot name="dropdown-button" />
	</button>
	<div popover id={popover_id} class="dropdown-links">
		<slot name="dropdown-links" />
	</div>
</div>

<style lang="postcss">
	.dropdown-menu {
		position: relative;
	}

	[popover] {
		background: var(--sheet-bg);
		border: solid 1px var(--black-7);
		border-radius: 6px;
		color: var(--white);
		padding: 10px;
		translate: 0 10px;
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
