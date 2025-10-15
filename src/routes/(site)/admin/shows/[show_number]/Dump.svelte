<script lang="ts">
	import Dump from './Dump.svelte';

	interface Props {
		data: Record<any, any> | any[];
	}

	let { data }: Props = $props();
	let entries = Object.entries(data);

	function getHeadersFromKeys(data: Record<string, any>[]) {
		return Object.keys(data.at(0) || {});
	}
</script>

<table>
	<thead>
		<tr>
			{#if Array.isArray(data)}
				<th>index</th>
				{#each getHeadersFromKeys(data) as header}
					<th>{header}</th>
				{/each}
			{:else}
				<th>Key</th>
				<th>Value</th>
			{/if}
		</tr></thead
	>
	<tbody>
		{#each entries as [key, val]}
			<tr>
				<td>{key}</td>
				{#if Array.isArray(val)}
					<td>
						<Dump data={val} />
					</td>
				{:else if val instanceof Date}
					<td>{val}</td>
				{:else if typeof val === 'object' && val !== null}
					{#each Object.entries(val) as [key, value]}
						<td>
							{value}
						</td>
					{/each}
				{:else}
					<td>{val}</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

<style lang="postcss">
	table {
		border: 1px solid var(--c-black);
		width: 100%;
		border-collapse: collapse;
		position: relative;
		color: var(--c-black);
	}

	th {
		padding: 10px;
		text-align: left;
		background: var(--c-black);
		color: var(--c-white);
	}

	td,
	th {
		border-bottom: 1px solid var(--c-black);
		padding: 10px;
		min-width: 50px;
	}
</style>
