<script lang="ts">
	interface Props {
		value?: Date | null;
		label?: string;
		id?: string;
		name?: string;
		show_clear?: boolean;
		onchange?: (next_value: Date | null) => void;
	}

	const uid = $props.id();

	let {
		value = $bindable<Date | null>(null),
		label = 'Publish at',
		id,
		name,
		show_clear = true,
		onchange
	}: Props = $props();
	let control_id = $derived(id ?? `${uid}-publish-at`);
	let field_name = $derived(name ?? id ?? 'publish_at');

	function pad_2(number_value: number): string {
		return String(number_value).padStart(2, '0');
	}

	function to_local_input_value(date_value: Date): string {
		return (
			[
				date_value.getFullYear(),
				pad_2(date_value.getMonth() + 1),
				pad_2(date_value.getDate())
			].join('-') + `T${pad_2(date_value.getHours())}:${pad_2(date_value.getMinutes())}`
		);
	}

	function from_local_input_value(input_value: string): Date | null {
		if (!input_value) {
			return null;
		}

		const matches = input_value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
		if (!matches) {
			return null;
		}

		const [, year_text, month_text, day_text, hour_text, minute_text] = matches;
		const year_value = Number(year_text);
		const month_value = Number(month_text);
		const day_value = Number(day_text);
		const hour_value = Number(hour_text);
		const minute_value = Number(minute_text);

		const next_value = new Date(
			year_value,
			month_value - 1,
			day_value,
			hour_value,
			minute_value,
			0,
			0
		);

		if (Number.isNaN(next_value.getTime())) {
			return null;
		}

		return next_value;
	}

	let local_value = $derived(
		value instanceof Date ? to_local_input_value(new Date(value.getTime())) : ''
	);

	function set_local_value(next_value: string): void {
		value = from_local_input_value(next_value);
		onchange?.(value);
	}

	function clear_value(): void {
		value = null;
		onchange?.(value);
	}
</script>

<div class="admin-field">
	<label for={control_id}>{label}</label>
	<div class="admin-control-row">
		<input
			id={control_id}
			name={field_name}
			type="datetime-local"
			bind:value={() => local_value, set_local_value}
		/>
		{#if show_clear}
			<button type="button" data-intent="quiet" onclick={clear_value}>Clear</button>
		{/if}
	</div>
</div>
