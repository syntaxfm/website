<script lang="ts">
	import { format, formatDistance } from 'date-fns';
	import { get_dashboard } from './admin_dashboard.remote';
	import { fetch_AI_notes, fetch_show_transcript } from './content/podcast/admin_podcast.remote';

	const dashboard = await get_dashboard();

	let action_message = $state('');
	let action_error = $state('');
	let busy_show_number = $state<number | null>(null);

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	type DashboardData = typeof dashboard;
	type ActivityItem = DashboardData['activity'][number];
	type ContentActivity = Extract<ActivityItem, { kind: 'content' }>;

	function content_edit_link(item: ContentActivity): string | null {
		if (item.content_type === 'PODCAST' && item.show) {
			return `/admin/content/podcast/${item.show.number}`;
		}
		if (item.content_type === 'ARTICLE') {
			return `/admin/content/articles/${item.content_id}`;
		}
		if (item.content_type === 'VIDEO') {
			return `/admin/content/videos/${item.content_id}`;
		}
		return null;
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Dashboard</h1>

	<div class="flex" style="--flex-gap: var(--pad-small); flex-wrap: wrap">
		<a class="button small" href="/admin/submissions?status=PENDING">
			<strong>{dashboard.pending_submissions_count}</strong>
			<span>&nbsp;Pending submissions</span>
		</a>
		<a class="button small" href="/admin/content?status=DRAFT">
			<strong>{dashboard.drafts_count}</strong>
			<span>&nbsp;Drafts</span>
		</a>
		<a class="button small" href="/admin/content?status=PUBLISHED">
			<strong>{dashboard.scheduled_count}</strong>
			<span>&nbsp;Scheduled</span>
		</a>
	</div>

	{#if dashboard.submission_breakdown.length > 0}
		<div class="flex" style="--flex-gap: var(--pad-xsmall); flex-wrap: wrap">
			{#each dashboard.submission_breakdown as bucket (bucket.submission_type)}
				<a
					class="button small"
					href={`/admin/submissions?status=PENDING&submission_type=${bucket.submission_type}`}
				>
					{bucket.submission_type}&nbsp;<strong>{bucket.count}</strong>
				</a>
			{/each}
		</div>
	{/if}

	{#if action_message}
		<p class="fs-2" style="color: var(--c-green)">{action_message}</p>
	{/if}
	{#if action_error}
		<p class="fs-2" style="color: var(--c-red)">{action_error}</p>
	{/if}

	{#if dashboard.activity.length > 0}
		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Recent activity (last 7 days)</h2>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>When</th>
							<th>What</th>
						</tr>
					</thead>
					<tbody>
						{#each dashboard.activity as item (item.kind === 'content' ? `c-${item.content_id}-${item.timestamp.getTime()}` : `s-${item.submission_id}`)}
							<tr>
								<td class="fs-1">{formatDistance(item.timestamp, new Date(), { addSuffix: true })}</td>
								<td>
									{#if item.kind === 'content'}
										{@const edit_link = content_edit_link(item)}
										<span class="fs-1">{item.was_published ? 'Published' : 'Updated'} · {item.content_type}</span>
										&nbsp;
										{#if edit_link}
											<a href={edit_link}>{item.title}</a>
										{:else}
											{item.title}
										{/if}
									{:else}
										<span class="fs-1">Submission · {item.submission_type}</span>
										&nbsp;
										<a href={`/admin/submissions?status=PENDING&submission_type=${item.submission_type}`}>
											{item.submitter_name || 'Anon'}
										</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<div class="split" style:--split-gap="var(--pad-small)">
			<h2 class="h5">Next shows</h2>
			<a href="/admin/content/podcast">All shows →</a>
		</div>
		{#if dashboard.next_shows.length === 0}
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
						{#each dashboard.next_shows as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										<a
											href={`/show/${show_row.number}/${show_row.slug}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{show_row.title}
										</a>
										<a href={`/admin/content/podcast/${show_row.number}`}>Edit</a>
									</div>
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
		{#if dashboard.shows_missing_transcript.length === 0}
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
						{#each dashboard.shows_missing_transcript as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										<a
											href={`/show/${show_row.number}/${show_row.slug}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{show_row.title}
										</a>
										<a href={`/admin/content/podcast/${show_row.number}`}>Edit</a>
									</div>
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
												await get_dashboard().refresh();
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
		{#if dashboard.shows_missing_ai_notes.length === 0}
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
						{#each dashboard.shows_missing_ai_notes as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										<a
											href={`/show/${show_row.number}/${show_row.slug}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{show_row.title}
										</a>
										<a href={`/admin/content/podcast/${show_row.number}`}>Edit</a>
									</div>
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
												await get_dashboard().refresh();
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
		{#if dashboard.recently_published.length === 0}
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
						{#each dashboard.recently_published as content_row (content_row.id)}
							<tr>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										{#if content_row.type === 'PODCAST' && content_row.show}
											<a
												href={`/show/${content_row.show.number}/${content_row.show.slug}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												{content_row.title}
											</a>
											<a href={`/admin/content/podcast/${content_row.show.number}`}>Edit</a>
										{:else if content_row.type === 'VIDEO' && content_row.video}
											<a href={content_row.video.url} target="_blank" rel="noopener noreferrer">
												{content_row.title}
											</a>
											<a href={`/admin/content/videos/${content_row.id}`}>Edit</a>
										{:else if content_row.type === 'ARTICLE'}
											<p>{content_row.title}</p>
											<a href={`/admin/content/articles/${content_row.id}`}>Edit</a>
										{:else}
											<p>{content_row.title}</p>
										{/if}
									</div>
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
