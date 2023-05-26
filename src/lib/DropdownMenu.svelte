<x-selectmenu>
	<div slot="button" behavior="button">
		<slot name="dropdown-button" />
	</div>
	<div popover slot="listbox" behavior="listbox">
		<slot name="dropdown-links" />
	</div>
</x-selectmenu>

<style lang="postcss">
	.dropdown-menu {
		position: relative;
	}

	.dropdown-button {
		cursor: pointer;
	}

	div[popover] {
		background: var(--sheet-bg);
		border: solid 1px var(--black-7);
		border-radius: 6px;
		color: var(--white);
		translate: 0px 3px;
	}

	:global(div[popover] button),
	:global(div[popover] .button) {
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
