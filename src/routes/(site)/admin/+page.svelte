<script lang="ts">
	import { format } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import { fetch_AI_notes, fetch_show_transcript } from './content/podcast/admin_podcast.remote';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let action_message = $state('');
	let action_error = $state('');
	let busy_show_number = $state<number | null>(null);

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	function edit_link_for(content_row: PageData['recently_published'][number]): string | null {
		if (content_row.type === 'PODCAST' && content_row.show) {
			return `/admin/content/podcast/${content_row.show.number}`;
		}

		if (content_row.type === 'ARTICLE') {
			return `/admin/content/articles/${content_row.id}`;
		}

		if (content_row.type === 'VIDEO') {
			return `/admin/content/videos/${content_row.id}`;
		}

		return null;
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Dashboard</h1>

	<div class="flex" style="--flex-gap: var(--pad-small); flex-wrap: wrap">
		<a class="button small" href="/admin/submissions?status=PENDING">
			<strong>{data.pending_submissions_count}</strong>
			<span>&nbsp;Pending submissions</span>
		</a>
		<a class="button small" href="/admin/content?status=DRAFT">
			<strong>{data.drafts_count}</strong>
			<span>&nbsp;Drafts</span>
		</a>
		<a class="button small" href="/admin/content?status=PUBLISHED">
			<strong>{data.scheduled_count}</strong>
			<span>&nbsp;Scheduled</span>
		</a>
	</div>

	{#if action_message}
		<p class="fs-2" style="color: var(--c-green)">{action_message}</p>
	{/if}
	{#if action_error}
		<p class="fs-2" style="color: var(--c-red)">{action_error}</p>
	{/if}

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<div class="split" style:--split-gap="var(--pad-small)">
			<h2 class="h5">Next shows</h2>
			<a href="/admin/content/podcast">All shows →</a>
		</div>
		{#if data.next_shows.length === 0}
			<p class="fs-2">No upcoming shows.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Title</th>
							<th>Date</th>
						</tr>
					</thead>
					<tbody>
						{#each data.next_shows as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<a href={`/admin/content/podcast/${show_row.number}`}>
										{show_row.title}
									</a>
								</td>
								<td>{format(show_row.date, 'MMM d, yyyy')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<h2 class="h5">Shows missing transcript (last 30 days)</h2>
		{#if data.shows_missing_transcript.length === 0}
			<p class="fs-2">All recent shows have transcripts.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Title</th>
							<th>Date</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each data.shows_missing_transcript as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<a href={`/admin/content/podcast/${show_row.number}`}>
										{show_row.title}
									</a>
								</td>
								<td>{format(show_row.date, 'MMM d, yyyy')}</td>
								<td>
									<form
										{...fetch_show_transcript.enhance(async ({ submit }) => {
											busy_show_number = show_row.number;
											clear_feedback();
											try {
												await submit();
												action_message = `Transcript fetch requested for show ${show_row.number}.`;
												await invalidateAll();
											} catch (error) {
												console.error(error);
												action_error =
													error instanceof Error ? error.message : 'Unable to fetch transcript.';
											} finally {
												busy_show_number = null;
											}
										})}
									>
										<input type="hidden" name="n:show_number" value={show_row.number} />
										<button type="submit" disabled={busy_show_number === show_row.number}>
											Fetch transcript
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<h2 class="h5">Shows missing AI notes (last 30 days)</h2>
		{#if data.shows_missing_ai_notes.length === 0}
			<p class="fs-2">All recent shows with transcripts have AI notes.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Title</th>
							<th>Date</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each data.shows_missing_ai_notes as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<a href={`/admin/content/podcast/${show_row.number}`}>
										{show_row.title}
									</a>
								</td>
								<td>{format(show_row.date, 'MMM d, yyyy')}</td>
								<td>
									<form
										{...fetch_AI_notes.enhance(async ({ submit }) => {
											busy_show_number = show_row.number;
											clear_feedback();
											try {
												await submit();
												action_message = `AI notes generated for show ${show_row.number}.`;
												await invalidateAll();
											} catch (error) {
												console.error(error);
												action_error =
													error instanceof Error ? error.message : 'Unable to generate AI notes.';
											} finally {
												busy_show_number = null;
											}
										})}
									>
										<input type="hidden" name="n:show_number" value={show_row.number} />
										<button type="submit" disabled={busy_show_number === show_row.number}>
											Generate AI notes
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<div class="split" style:--split-gap="var(--pad-small)">
			<h2 class="h5">Recently published (last 7 days)</h2>
			<a href="/admin/content?status=PUBLISHED">All published →</a>
		</div>
		{#if data.recently_published.length === 0}
			<p class="fs-2">Nothing published in the last week.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Title</th>
							<th>Type</th>
							<th>Published</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recently_published as content_row (content_row.id)}
							{@const edit_link = edit_link_for(content_row)}
							<tr>
								<td>
									{#if edit_link}
										<a href={edit_link}>{content_row.title}</a>
									{:else}
										{content_row.title}
									{/if}
								</td>
								<td>{content_row.type}</td>
								<td>
									{#if content_row.published_at}
										{format(content_row.published_at, 'MMM d, yyyy HH:mm')}
									{:else}
										-
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
