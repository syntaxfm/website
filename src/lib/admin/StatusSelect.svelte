<script lang="ts">
	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	interface Props {
		status?: Status;
		label?: string;
		id?: string;
		name?: string;
		disabled?: boolean;
		onchange?: (next_status: Status) => void;
	}

	const uid = $props.id();

	let {
		status = $bindable<Status>('DRAFT'),
		label = 'Status',
		id,
		name,
		disabled = false,
		onchange
	}: Props = $props();

	const status_options: { value: Status; label: string }[] = [
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'PUBLISHED', label: 'Published' },
		{ value: 'ARCHIVED', label: 'Archived' }
	];

	let control_id = $derived(id ?? `${uid}-status`);
	let field_name = $derived(name ?? id ?? 'status');

	function handle_status_change(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLSelectElement)) {
			return;
		}

		const next_value = target.value;
		if (next_value === 'DRAFT' || next_value === 'PUBLISHED' || next_value === 'ARCHIVED') {
			status = next_value;
			onchange?.(status);
		}
	}
</script>

<div class="admin-field">
	<label for={control_id}>{label}</label>
	<select
		id={control_id}
		name={field_name}
		value={status}
		{disabled}
		onchange={handle_status_change}
	>
		{#each status_options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>
