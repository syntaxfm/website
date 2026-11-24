<script lang="ts">
	import { format } from 'date-fns';

	interface Props {
		value: Date | string | null | undefined;
		show_time?: boolean;
	}

	let { value, show_time = false }: Props = $props();

	let date = $derived(value ? new Date(value) : null);
</script>

<td class="admin-cell-date">
	{#if date}
		<time datetime={date.toISOString()}>
			{format(date, 'MMM d, yyyy')}
			{#if show_time}
				<small>{format(date, 'HH:mm')}</small>
			{/if}
		</time>
	{:else}
		-
	{/if}
</td>
