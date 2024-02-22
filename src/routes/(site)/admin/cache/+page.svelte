<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	export let data;
	$: ({ cache = [] } = data);
</script>

<h1 class="h4">Cache</h1>

<AdminActions>
	<form action="/?/dump_cache" use:enhance={form_action()} method="POST">
		<button>Dump Cache</button>
	</form>
</AdminActions>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>key</th>
			</tr>
		</thead>
		<tbody>
			{#if cache.length > 0}
				{#each cache as key}
					<tr>
						<td>{key}</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td>Cache Not Available</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
