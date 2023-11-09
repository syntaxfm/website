<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ cache } = data);
</script>

<h1>Cache</h1>

<table>
	<thead>
		<tr>
			<th>key</th>
		</tr>
	</thead>
	<tbody>
		{#each cache as key}
			<tr>
				<td>{key}</td>
			</tr>
		{/each}
	</tbody>
</table>
