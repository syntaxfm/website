<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ cache = [] } = data);
</script>

<h1>Cache</h1>

<div>
	<form action="/?/dump_cache" use:enhance={form_action()} method="POST">
		<button>Dump Cache</button>
	</form>
</div>

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
