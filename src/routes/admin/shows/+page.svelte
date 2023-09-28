<script lang="ts">
	import { enhance } from '$app/forms';
	import FormWithLoader from '$lib/FormWithLoader.svelte';
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
		<button type="submit">Refresh Webhook Test</button>
	</form>
	<form action="?/refresh_all" method="post" use:enhance={form_action()}>
		<button type="submit">Resync All Shows</button>
	</form>
</div>

<table>
	<thead>
		<tr>
			<th>Number</th>
			<th>Title</th>
			<th>Type</th>
			<th>Release Date</th>
			<th>Guest Count</th>
			<th>Transcript</th>
			<th>AI Notes</th>
		</tr>
	</thead>
	<tbody>
		{#each shows as show}
			<tr>
				<td>
					<a href="/admin/shows/{show.number}">#{show.number}</a>
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
				<td class="center">{show._count.guests}</td>
				<td class="center"
					>{#if show.transcript}
						✅
					{:else}
						<form action="?/fetch_show_transcript" method="post" use:enhance={form_action()}>
							<input type="hidden" name="show_number" value={show.number} />
							<button type="submit">Fetch</button>
						</form>
					{/if}</td
				>
				<td class="center">
					<FormWithLoader global={false} action="?/fetch_AI_notes" method="post" let:loading>
						<fieldset disabled={loading}>
							<input type="hidden" name="show_number" value={show.number} />
							{#if show.aiShowNote}
								✅
								<button type="submit"> Refetch{loading ? 'ing' : ''}</button>
							{:else}
								<button type="submit">Fetch{loading ? 'ing' : ''}</button>
							{/if}
						</fieldset>
					</FormWithLoader>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style lang="postcss">
	table {
		border: 1px solid black;
		width: 100%;
		border-collapse: collapse;
		width: 125%;
		left: -12.5%;
		position: relative;
	}
	fieldset {
		border: none;
		margin: 0;
		padding: 0;
	}
	th {
		padding: 10px;
		text-align: left;
		background: black;
		color: white;
	}
	td {
		border-bottom: 1px solid black;
		padding: 10px;
	}

	.center {
		text-align: center;
	}
</style>
