<script lang="ts">
	import { goto } from '$app/navigation';
	export let options: { value: string; label: string }[];
</script>

<form
	action="/shows"
	method="GET"
	on:change={(e) => {
		goto(`?order=${e.target.value}`);
	}}
>
	<x-selectmenu id="order">
		<div slot="button" behavior="button">
			<slot name="dropdown-button" />
		</div>
		{#each options as option}
			<x-option value={option.value}>{option.label}</x-option>
		{/each}
	</x-selectmenu>
</form>

<style lang="postcss">
	x-selectmenu::part(listbox) {
		background: var(--sheet-bg);
		border: solid 1px var(--black-7);
		border-radius: 6px;
		color: var(--white);
		translate: 0px 3px;
		padding: 10px;
	}

	x-option {
		background: none;
		text-align: left;
		font-size: var(--font-size-sm);
		box-shadow: none;
		white-space: nowrap;
		font-family: var(--body-font-familly);
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
