<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '$lib/Icon.svelte';

	type Props = Omit<HTMLInputAttributes, 'id' | 'placeholder' | 'type' | 'value'> & {
		id?: string;
		label?: string;
		placeholder?: string;
		value?: string;
	};

	const component_id = $props.id();
	let {
		id = `${component_id}-filter`,
		label = 'Search',
		placeholder = 'Search',
		value = $bindable(''),
		...rest
	}: Props = $props();
</script>

<label for={id}>
	<span class="visually-hidden">{label}</span>
	<Icon name="search" width="1.25em" height="1.25em" />
	<input {...rest} {id} type="search" {placeholder} bind:value />
</label>

<style>
	label {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: var(--pad-medium);
		width: 100%;
		padding: 0 var(--pad-medium);
		border-radius: var(--br-huge);
		background: var(--c-fg-1);
	}

	label:focus-within {
		outline: var(--b-light);
		outline-color: var(--c-primary);
		outline-offset: var(--pad-xsmall);
	}

	input {
		padding: var(--pad-small) 0;
		border: 0;
		outline: 0;
		background: transparent;
		font-size: var(--fs-4);
	}

	input::placeholder {
		color: var(--c-fg-6);
		opacity: 1;
	}
</style>
