<script lang="ts">
	import { onMount } from 'svelte';

	export let data: Record<any, any> | any[];
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
						<svelte:self data={val} />
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
		border: 1px solid black;
		width: 100%;
		border-collapse: collapse;
		position: relative;
	}
	th {
		padding: 10px;
		text-align: left;
		background: black;
		color: white;
	}
	td,
	th {
		border-bottom: 1px solid black;
		padding: 10px;
		min-width: 50px;
	}
</style>
