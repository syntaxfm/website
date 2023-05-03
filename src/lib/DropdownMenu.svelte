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
		border-radius: 6px;
		box-shadow: var(--level_3);
		display: flex;
		justify-content: flex-end;
		min-width: 200px;
		padding: 1rem;
		position: absolute;
		right: -15px;
		text-align: right;
		top: 60px;
		color: var(--white);
		z-index: var(--headerLevel);
		&::after {
			content: '';
			position: absolute;
			top: -8px;
			right: 30px;
			background-color: var(--deep_purp_1);
			width: 15px;
			height: 15px;
			transform: rotate(45deg);
		}
	}
</style>
