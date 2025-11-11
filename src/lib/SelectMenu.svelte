<script lang="ts">
	import { anchor } from '$actions/anchor';
	import type { IconName } from './Icon.svelte';
	import Icon from './Icon.svelte';
	// Polyfill for Popover. Remove once Firefox supports it. https://caniuse.com/?search=popover
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { apply, isSupported } from '@oddbird/popover-polyfill/fn';

	if (!isSupported() && browser) {
		apply();
	}
	interface Props {
		options: { value: string; label: string }[];
		button_icon?: IconName[number] | null;
		value_as_label?: boolean;
		button_text: string;
		popover_id: string;
		value?: string;
	}

	let {
		options,
		button_icon = null,
		value_as_label = false,
		button_text,
		popover_id,
		value = ''
	}: Props = $props();
	let id = popover_id.replace('filter-', '');
	// let searchParams = new URLSearchParams(window.location.search);
	//

	function generate_search_params(id: string, value: string) {
		const searchParams = new URLSearchParams(page.url.search);
		if (!value) {
			searchParams.delete(id);
		} else {
			searchParams.set(id, value);
		}
		return searchParams.toString();
	}

	function closePopoverWhenSelected(node: HTMLDivElement) {
		function handlePopoverSelection(event: MouseEvent) {
			if (event.target instanceof HTMLAnchorElement) {
				node.hidePopover();
			}
		}
		node.addEventListener('click', handlePopoverSelection);
		return {
			destroy() {
				node.removeEventListener('click', handlePopoverSelection);
			}
		};
	}
</script>

<div style="position: relative;">
	<button popovertarget={popover_id} use:anchor={{ id: popover_id, position: ['BOTTOM', 'LEFT'] }}>
		{#if button_icon}
			<Icon name={button_icon} />
		{/if}
		{#if value_as_label}
			{value}
		{/if}
		{button_text}
		<Icon name="down" />
	</button>
	<div popover id={popover_id} use:closePopoverWhenSelected>
		<div class="select-menu-menu-wrapper">
			{#each options as option}
				<a
					onclick={onselect}
					class:selected={option.value === value}
					href={`?${generate_search_params(id, option.value)}`}>{option.label}</a
				>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	[popover] {
		background: var(--c-bg);
		box-shadow: inset 0 0 0 1px var(--c-black-1);
		border-radius: var(--br-medium);
		padding: 10px;
		translate: 0 10px;
		border: none;
	}

	button {
		background: var(--c-tint-or-shade);
		padding: 10px 2rem 8px;
		border-radius: var(--br-huge);
		font-size: var(--fs-2);
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 10px;
		border: none;
		cursor: pointer;
		color: var(--c-fg);

		&:hover {
			background: var(--c-tint-or-shade-light);
		}
	}

	.select-menu-menu-wrapper {
		flex-direction: column;
		gap: 10px;
		display: flex;
	}

	div[popover] a {
		background: none;
		text-align: left;
		box-shadow: none;
		white-space: nowrap;
		padding: 8px 14px;
		cursor: pointer;
		font-size: var(--fs-4);
		color: var(--c-fg);
		border-radius: 4px;

		&:hover,
		&.selected {
			background: var(--c-black-1);
		}
	}
</style>
