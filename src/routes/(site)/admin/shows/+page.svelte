<script lang="ts">
	import { enhance } from '$app/forms';
	import FormWithLoader from '$lib/FormWithLoader.svelte';
	import { form_action } from '$lib/form_action';
	import { format } from 'date-fns';
	export let data;
	$: ({ shows } = data);

	let confirm = false;
</script>

<h4>Shows</h4>
<div class="flex" style="gap: 10px;">
	<form action="?/import_all_shows" method="post" use:enhance={form_action()}>
		<button type="submit">Import All Shows</button>
	</form>

	<form action="/webhooks/refresh" method="post">
		<button type="submit">Refresh Webhook Test</button>
	</form>
	<form action="?/refresh_all" method="post" use:enhance={form_action()}>
		<button type="submit">Resync All Shows</button>
	</form>

	<form
		action="?/delete_all_shows"
		method="post"
		style="position: relative;"
		use:enhance={form_action()}
	>
		{#if !confirm}
			<button
				on:click={() => {
					confirm = true;
				}}
				class="warning">Drop All Shows</button
			>
		{:else}
			<p class="small" style="position: absolute; top: -120%; width: auto; white-space: nowrap;">
				This will delete all shows, guests, transcripts (utterance, word and transcripts)
			</p>
			<button type="submit" class="warning">For real, drop um'</button>
		{/if}
	</form>
</div>

<div>
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
						<a href="/{show.number}" target="_blank">
							{show.title}
							[↗]</a
						>
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
							✅ <FormWithLoader
								global={false}
								action="?/delete_transcript"
								method="post"
								let:loading
							>
								<input type="hidden" name="show_number" value={show.number} />
								<button class="warning" type="submit">{loading ? 'Deleting' : 'Delete'}</button>
							</FormWithLoader>
						{:else}
							<FormWithLoader
								global={false}
								action="?/fetch_show_transcript"
								method="post"
								let:loading
							>
								<input type="hidden" name="show_number" value={show.number} />
								<button type="submit">Fetch{loading ? 'ing' : ''}</button>
							</FormWithLoader>
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
</div>

<style lang="postcss">
	table {
		border: 1px solid black;
		width: 100%;
		border-collapse: collapse;
		width: 125%;
		left: -12.5%;
		position: relative;
	}

	thead {
		top: 0;
		position: sticky;
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
