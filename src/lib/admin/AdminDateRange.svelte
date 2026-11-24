<script lang="ts">
	type DateKey = 'date_from' | 'date_to';

	interface Props {
		from: string;
		to: string;
		onchange: (key: DateKey, value: string) => void;
	}

	let { from, to, onchange }: Props = $props();
</script>

<label class="admin-inline-field">
	From
	<input
		type="date"
		value={from}
		onchange={(event) => onchange('date_from', event.currentTarget.value)}
	/>
</label>
<label class="admin-inline-field">
	To
	<input
		type="date"
		value={to}
		onchange={(event) => onchange('date_to', event.currentTarget.value)}
	/>
</label>
