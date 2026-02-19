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
		onselect?: (value: string) => void;
		disabled?: boolean;
	}

	let {
		options,
		button_icon = null,
		value_as_label = false,
		button_text,
		popover_id,
		value = '',
		onselect,
		disabled = false
	}: Props = $props();
	let id = $derived(popover_id.replace('filter-', ''));
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

	function close_popover_when_selected(event: MouseEvent) {
		const current_target = event.currentTarget;
		if (!(current_target instanceof HTMLDivElement)) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		if (target.closest('a, button')) {
			current_target.hidePopover();
		}
	}
</script>

<div style="position: relative;">
	<button
		type="button"
		{disabled}
		popovertarget={popover_id}
		use:anchor={{ id: popover_id, position: ['BOTTOM', 'LEFT'] }}
	>
		{#if button_icon}
			<Icon name={button_icon} />
		{/if}
		{#if value_as_label}
			{value}
		{/if}
		{button_text}
		<Icon name="down" />
	</button>
	<div popover id={popover_id} onclick={close_popover_when_selected}>
		<div class="select-menu-menu-wrapper">
			{#each options as option (option.value)}
				{#if onselect}
					<button
						type="button"
						class:selected={option.value === value}
						onclick={() => onselect(option.value)}>{option.label}</button
					>
				{:else}
					<a
						class:selected={option.value === value}
						href={`?${generate_search_params(id, option.value)}`}>{option.label}</a
					>
				{/if}
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
		background: var(--c-fg-1);
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
			background: var(--c-fg-05);
		}
	}

	.select-menu-menu-wrapper {
		flex-direction: column;
		gap: 10px;
		display: flex;
	}

	div[popover] :is(a, button) {
		background: none;
		text-align: left;
		box-shadow: none;
		white-space: nowrap;
		padding: 8px 14px;
		cursor: pointer;
		font-size: var(--fs-4);
		color: var(--c-fg);
		border-radius: 4px;
		border: none;
		width: 100%;
		font-family: inherit;

		&:hover,
		&.selected {
			background: var(--c-black-1);
		}
	}
</style>
