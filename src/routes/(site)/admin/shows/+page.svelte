<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import AdminSearch from '$/lib/AdminSearch.svelte';
	import { dev } from '$app/environment';
	import { enhance } from '$app/forms';
	import FormWithLoader from '$lib/FormWithLoader.svelte';
	import { form_action } from '$lib/form_action';
	import { format } from 'date-fns';
	export let data;
	$: ({ shows } = data);

	let confirm = false;
	let search_text = '';
</script>

<h1 class="h4">Shows</h1>

<AdminActions>
	<form action="?/import_all_shows" method="POST" use:enhance={form_action()}>
		<button type="submit">Sync Changed/New Shows</button>
	</form>

	<form action="?/refresh_all" method="POST" use:enhance={form_action()}>
		<button class="subtle" type="submit">Sync All Shows</button>
	</form>

	<form action="/webhooks/refresh" method="GET">
		<button class="subtle" type="submit">Test Refresh Webhook </button>
	</form>

	{#if dev}
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
	{/if}
</AdminActions>

<div>
	<AdminSearch bind:text={search_text} />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Number</th>
					<th>Title</th>
					<th>Type</th>
					<th>Guests</th>
					<th>Transcript</th>
					<th>AI Notes</th>
				</tr>
			</thead>
			<tbody>
				{#each shows.filter((s) => s.title
						.toLowerCase()
						.includes(search_text.toLowerCase())) as show}
					<tr>
						<td>
							<a href="/admin/shows/{show.number}">#{show.number}</a>
						</td>
						<td>
							<a href="/{show.number}" target="_blank">
								{show.title}
								[↗]</a
							>
							<br />
							<span class="text-xs">
								{show.date.getTime() > Date.now() ? 'Scheduled' : 'Published'}
								{format(show.date, 'EEE MMM d yyyy h:mm:ss a z')}
							</span>
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
</div>

<style lang="postcss">
	tr {
		display: grid;
		grid-template-columns: 80px 550px 150px 90px auto auto;
	}

	fieldset {
		border: none;
		margin: 0;
		padding: 0;
	}

	.center {
		text-align: center;
	}
</style>
