<script lang="ts">
	import SelectMenu from '#lib/SelectMenu.svelte';
	import type { FilterOption } from './admin_filters.ts';

	interface Props {
		// Shown while nothing is chosen ('')
		label: string;
		value?: string;
		options: FilterOption[];
		onselect: (value: string) => void;
		disabled?: boolean;
	}

	const uid = $props.id();
	let { label, value = '', options, onselect, disabled = false }: Props = $props();

	let button_text = $derived(
		(value && options.find((option) => option.value === value)?.label) || label
	);
</script>

<SelectMenu popover_id={`menu-${uid}`} {button_text} {value} {options} {onselect} {disabled} />
