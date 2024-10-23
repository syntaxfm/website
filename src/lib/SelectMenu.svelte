<script lang="ts">
	import { anchor } from '$actions/anchor';
	import type { IconName } from './Icon.svelte';
	import Icon from './Icon.svelte';
	// Polyfill for Popover. Remove once Firefox supports it. https://caniuse.com/?search=popover
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { apply, isSupported } from '@oddbird/popover-polyfill/fn';

	if (!isSupported() && browser) {
		apply();
	}
	interface Props {
		options: { value: string; label: string }[];
		button_icon?: IconName | null;
		value_as_label?: boolean;
		button_text: string;
		popover_id: string;
		value?: string;
		onselect: (e: CustomEvent) => void;
	}

	let {
		options,
		button_icon = null,
		value_as_label = false,
		button_text,
		popover_id,
		value = '',
		onselect
	}: Props = $props();
	let id = popover_id.replace('filter-', '');
	// let searchParams = new URLSearchParams(window.location.search);

	let generate_search_params = $derived((id: string, value: string) => {
		const searchParams = new URLSearchParams($page.url.search);
		if (!value) {
			searchParams.delete(id);
		} else {
			searchParams.set(id, value);
		}
		return searchParams.toString();
	});

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
	<button
		popovertarget={popover_id}
		use:anchor={{ id: popover_id, position: ['BOTTOM', 'LEFT'] }}
		class="subtle"
	>
		{#if button_icon}
			<Icon name={button_icon} />
		{/if}
		{#if value_as_label}
			{value}
		{/if}
		{button_text}
	</button>
	<div popover id={popover_id} use:closePopoverWhenSelected>
		<div class="select-menu-menu-wrapper">
			{#each options as option}
				<a
					class:selected={option.value === value}
					href={`?${generate_search_params(id, option.value)}`}>{option.label}</a
				>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	[popover] {
		background: var(--bg-1);
		box-shadow: inset 0 0 0 1px var(--subtle);
		border-radius: var(--brad);
		padding: 10px;
		translate: 0 10px;
		border: none;
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
		padding: 8px 14px;
		cursor: pointer;
		font-size: var(--body-font-size);
		color: var(--fg);
		border-radius: 4px;
		&:hover,
		&.selected {
			background: var(--subtle);
		}
	}
</style>
