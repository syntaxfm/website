<script lang="ts">
	import Icon from './Icon.svelte';
	import { anchor } from '$actions/anchor';
	import type { IconName } from './Icon.svelte';

	export let options: { value: string; label: string }[];
	export let button_icon: IconName;
	export let button_text: string;
	export let popover_id: string;
	let id = popover_id.replace('filter-', '');
	export let value: string = '';
	// let searchParams = new URLSearchParams(window.location.search);
	import { page } from '$app/stores';
	$: generate_search_params = (id: string, value: string) => {
		const searchParams = new URLSearchParams($page.url.search);
		if (!value) {
			searchParams.delete(id);
		} else {
			searchParams.set(id, value);
		}
		return searchParams.toString();
	};
</script>

<div style="position: relative;">
	<button
		popovertarget={popover_id}
		use:anchor={{ id: popover_id, position: ['BOTTOM', 'LEFT'] }}
		class="subtle"
	>
		<Icon name={button_icon} />
		{button_text}
	</button>
	<div popover id={popover_id}>
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
		background: var(--bg-sheet);
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
		&:hover,
		&.selected {
			background: var(--zebra);
		}
	}
</style>
