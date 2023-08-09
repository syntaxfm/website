<script lang="ts">
	// ? What is this
	// A popover based drop down menu. Less specific than the Select Menu
	// This uses slots instead of props
	import { anchor } from '$actions/anchor';
	export let isOpen: boolean = false;

	export let popover_id: string;
</script>

<div class="dropdown-menu">
	<button
		popovertarget={popover_id}
		class="dropdown-button button-reset"
		use:anchor={{ id: popover_id, position: ['BOTTOM', 'RIGHT'] }}
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
		background: var(--bg-sheet);
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
		background: var(--bg-sheet);
		border: solid 1px var(--black-7);
		border-radius: 6px;
		color: var(--white);
		translate: 0px 3px;
		position: absolute;
		z-index: 10;
	}
</style>
