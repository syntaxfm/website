<script lang="ts">
	import type { IconName } from './Icon.svelte';
	import Icon from './Icon.svelte';
	import { anchor } from '$actions/anchor';
	export let options: { value: string; label: string }[];

	export let button_icon: IconName;
	export let button_text: string;
	export let popover_id: string;
</script>

<div style="position: relative;">
	<button popovertarget={popover_id} use:anchor={popover_id} class="subtle">
		<Icon name={button_icon} />
		{button_text}
	</button>
	<div popover id={popover_id} class="select-menue">
		<div class="select-menu-menu-wrapper">
			{#each options as option}
				<a href={`?filter=${option.value}`}>{option.label}</a>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	[popover] {
		background: var(--sheet-bg);
		border: solid 1px var(--black-7);
		border-radius: 6px;
		color: var(--white);
		padding: 10px;
		translate: 0 10px;
	}

	.select-menu-menu-wrapper {
		flex-direction: column;
		gap: 10px;
		display: flex;
	}

	div[popover] a {
		background: none;
		text-align: left;
		font-size: var(--font-size-sm);
		box-shadow: none;
		white-space: nowrap;
		font-family: var(--body-font-family);
		font-weight: 600;
		padding: 8px 14px;
		cursor: pointer;
		font-size: var(--body-font-size);
		color: var(--button-color);
		border-radius: 4px;
		&:hover {
			background: var(--zebra);
		}
	}
</style>
