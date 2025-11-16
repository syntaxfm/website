<script lang="ts">
	import { dev } from '$app/environment';
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import { format } from 'date-fns';
	import { get_all_shows, import_all_shows, refresh_all } from './admin_podcast.remote';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';
	import RemoteFormButton from '$lib/forms/RemoteFormButton.svelte';

	let confirm = $state(false);
	let search_text = $state('');
	let shows = await get_all_shows();
</script>

<h1 class="h4">Shows</h1>

<AdminActions>
	<RemoteFormButton class="small" remote={import_all_shows}>Sync Changed/New Shows</RemoteFormButton
	>
	<RemoteFormButton class="small" remote={refresh_all}>Refresh All Shows</RemoteFormButton>
	<form action="/webhooks/refresh" method="GET">
		<button class="small" type="submit">Refresh Webhook</button>
	</form>
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
								{show?.title}
								[↗]</a
							>
							<br />
							<span>
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

						<td class="center">
							<!-- {show._count.guests} -->
						</td>
						<td class="center">
							<!-- {#if show.transcript}
								✅ <FormWithLoader global={false} action="?/delete_transcript" method="post">
									{#snippet children({ loading })}
										<input type="hidden" name="show_number" value={show.number} />
										<button class="warning" type="submit">{loading ? 'Deleting' : 'Delete'}</button>
									{/snippet}
								</FormWithLoader>
							{:else}
								<FormWithLoader global={false} action="?/fetch_show_transcript" method="post">
									{#snippet children({ loading })}
										<input type="hidden" name="show_number" value={show.number} />
										<button type="submit">Fetch{loading ? 'ing' : ''}</button>
									{/snippet}
								</FormWithLoader>
							{/if} -->
						</td>
						<td class="center">
							<!-- <FormWithLoader global={false} action="?/fetch_AI_notes" method="post">
								{#snippet children({ loading })}
									<fieldset disabled={loading}>
										<input type="hidden" name="show_number" value={show.number} />
										{#if show.aiShowNote}
											✅
											<button type="submit"> Refetch{loading ? 'ing' : ''}</button>
										{:else}
											<button type="submit">Fetch{loading ? 'ing' : ''}</button>
										{/if}
									</fieldset>
								{/snippet}
							</FormWithLoader> -->
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
