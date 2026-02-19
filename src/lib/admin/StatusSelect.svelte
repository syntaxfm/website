<script lang="ts">
	import SelectMenu from '$lib/SelectMenu.svelte';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	interface Props {
		status?: Status;
		label?: string;
		id?: string;
		disabled?: boolean;
	}

	let {
		status = $bindable<Status>('DRAFT'),
		label = 'Status',
		id = 'status',
		disabled = false
	}: Props = $props();

	const status_options: { value: Status; label: string }[] = [
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'PUBLISHED', label: 'Published' },
		{ value: 'ARCHIVED', label: 'Archived' }
	];

	let selected_status_label = $derived.by(
		() => status_options.find((option) => option.value === status)?.label ?? 'Draft'
	);

	function handle_status_select(next_value: string) {
		if (next_value === 'DRAFT' || next_value === 'PUBLISHED' || next_value === 'ARCHIVED') {
			status = next_value;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-xsmall)">
	<span class="fs-2">{label}</span>
	<SelectMenu
		popover_id={`${id}-menu`}
		button_text={selected_status_label}
		value={status}
		options={status_options}
		{disabled}
		onselect={handle_status_select}
	/>
	<input type="hidden" name={id} value={status} />
</div>
