<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import { format } from 'date-fns';

	export let data;
	$: ({ shows } = data);
</script>

<h4>Shows</h4>
<div>
	<form action="?/import_all_shows" method="post" use:enhance={form_action()}>
		<button type="submit">Import All Shows</button>
	</form>
	<form action="?/delete_all_shows" method="post" use:enhance={form_action()}>
		<button type="submit">Drop All Shows</button>
	</form>
	<form action="/webhooks/refresh" method="post">
		<button type="submit">Test Post</button>
	</form>

	<button>Resync All Shows</button>
</div>

<table>
	<thead>
		<tr>
			<th>Number</th>
			<th>Title</th>
			<th>Release Date</th>
		</tr>
	</thead>
	<tbody>
		{#each shows as show}
			<tr>
				<td>
					{'#'}{show.number}
				</td>
				<td>
					{show.title}
				</td>
				<td>
					{#if format(show.date, 'EEE') === 'Mon'}
						Hasty
					{:else if format(show.date, 'EEE') === 'Wed'}
						Tasty
					{:else if format(show.date, 'EEE') === 'Fri'}
						Supper Club
					{/if}
				</td>
				<td>
					{format(show.date, 'EEE MMMM d yy')}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
