<script lang="ts">
	import { format, formatDistance } from 'date-fns';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { get_dashboard } from './admin_dashboard.remote';

	const dashboard = await get_dashboard();
	const today_iso_date_string = format(new Date(), 'yyyy-MM-dd');

	type DashboardData = typeof dashboard;
	type ActivityItem = DashboardData['activity'][number];
	type ContentActivity = Extract<ActivityItem, { kind: 'content' }>;

	type EditLinkInput = {
		content_id?: string;
		id?: string;
		content_type?: ContentActivity['content_type'];
		type?: ContentActivity['content_type'];
		show: { number: number; slug: string } | null;
	};

	function content_edit_link(item: EditLinkInput): Pathname | null {
		const content_type = item.content_type ?? item.type;
		const content_id = item.content_id ?? item.id;
		if (content_type === 'PODCAST' && item.show) {
			return `/admin/content/podcast/${item.show.number}`;
		}
		if (content_type === 'ARTICLE' && content_id) {
			return `/admin/content/articles/${content_id}`;
		}
		if (content_type === 'VIDEO' && content_id) {
			return `/admin/content/videos/${content_id}`;
		}
		return null;
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Dashboard</h1>

	<div
		class="flex"
		style="

--flex-gap: var(--pad-small);

 flex-wrap: wrap"
	>
		<a class="button small" href={resolve('/admin/submissions?status=PENDING')}>
			<strong>{dashboard.pending_submissions_count}</strong>
			<span>&nbsp;Pending submissions</span>
		</a>
		<a class="button small" href={resolve('/admin/content?status=DRAFT')}>
			<strong>{dashboard.drafts_count}</strong>
			<span>&nbsp;Drafts</span>
		</a>
		<a
			class="button small"
			href={resolve(`/admin/content?status=PUBLISHED&date_from=${today_iso_date_string}`)}
		>
			<strong>{dashboard.scheduled_count}</strong>
			<span>&nbsp;Scheduled</span>
		</a>
	</div>

	{#if dashboard.submission_breakdown.length > 0}
		<div
			class="flex"
			style="

--flex-gap: var(--pad-xsmall);

 flex-wrap: wrap"
		>
			{#each dashboard.submission_breakdown as bucket (bucket.submission_type)}
				<a
					class="button small"
					href={resolve(
						`/admin/submissions?status=PENDING&submission_type=${bucket.submission_type}`
					)}
				>
					{bucket.submission_type}&nbsp;<strong>{bucket.count}</strong>
				</a>
			{/each}
		</div>
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
								<td class="fs-1"
									>{formatDistance(item.timestamp, new Date(), { addSuffix: true })}</td
								>
								<td>
									{#if item.kind === 'content'}
										{@const edit_link = content_edit_link(item)}
										<span class="fs-1"
											>{item.was_published ? 'Published' : 'Updated'} · {item.content_type}</span
										>
										&nbsp;
										{#if edit_link}
											<a href={resolve(edit_link)}>{item.title}</a>
										{:else}
											{item.title}
										{/if}
									{:else}
										<span class="fs-1">Submission · {item.submission_type}</span>
										&nbsp;
										<a
											href={resolve(
												`/admin/submissions?status=PENDING&submission_type=${item.submission_type}`
											)}
										>
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
			<h2 class="h5">Upcoming</h2>
			<a href={resolve(`/admin/content?status=PUBLISHED&date_from=${today_iso_date_string}`)}
				>All upcoming →</a
			>
		</div>
		{#if dashboard.upcoming_content.length === 0}
			<p class="fs-2">Nothing scheduled.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Title</th>
							<th>Type</th>
							<th>Scheduled</th>
						</tr>
					</thead>
					<tbody>
						{#each dashboard.upcoming_content as content_row (content_row.id)}
							<tr>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										{#if content_row.type === 'PODCAST' && content_row.show}
											<a
												href={resolve(`/show/${content_row.show.number}/${content_row.show.slug}`)}
												target="_blank"
												rel="noopener noreferrer"
											>
												{content_row.title}
											</a>
											<a href={resolve(`/admin/content/podcast/${content_row.show.number}`)}>Edit</a
											>
										{:else if content_row.type === 'VIDEO' && content_row.video}
											<a
												href={content_row.video.url}
												target="_blank"
												rel="noopener noreferrer external"
											>
												{content_row.title}
											</a>
											<a href={resolve(`/admin/content/videos/${content_row.id}`)}>Edit</a>
										{:else if content_row.type === 'ARTICLE'}
											<p>{content_row.title}</p>
											<a href={resolve(`/admin/content/articles/${content_row.id}`)}>Edit</a>
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

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<h2 class="h5">Stale drafts (not touched in 14+ days)</h2>
		{#if dashboard.stale_drafts.length === 0}
			<p class="fs-2">No stale drafts.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Title</th>
							<th>Type</th>
							<th>Last updated</th>
						</tr>
					</thead>
					<tbody>
						{#each dashboard.stale_drafts as draft_row (draft_row.id)}
							{@const edit_link = content_edit_link(draft_row)}
							<tr>
								<td>
									{#if edit_link}
										<a href={resolve(edit_link)}>{draft_row.title}</a>
									{:else}
										{draft_row.title}
									{/if}
								</td>
								<td>{draft_row.type}</td>
								<td>{format(draft_row.updated_at, 'MMM d, yyyy')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="stack" style:--stack-gap="var(--pad-small)">
		<h2 class="h5">Shows missing transcript</h2>
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
						</tr>
					</thead>
					<tbody>
						{#each dashboard.shows_missing_transcript as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										<a
											href={resolve(`/show/${show_row.number}/${show_row.slug}`)}
											target="_blank"
											rel="noopener noreferrer"
										>
											{show_row.title}
										</a>
										<a href={resolve(`/admin/content/podcast/${show_row.number}`)}>Edit</a>
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
		<h2 class="h5">Shows missing AI notes</h2>
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
						</tr>
					</thead>
					<tbody>
						{#each dashboard.shows_missing_ai_notes as show_row (show_row.id)}
							<tr>
								<td>{show_row.number}</td>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										<a
											href={resolve(`/show/${show_row.number}/${show_row.slug}`)}
											target="_blank"
											rel="noopener noreferrer"
										>
											{show_row.title}
										</a>
										<a href={resolve(`/admin/content/podcast/${show_row.number}`)}>Edit</a>
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
		<div class="split" style:--split-gap="var(--pad-small)">
			<h2 class="h5">Recently published (last 7 days)</h2>
			<a href={resolve('/admin/content?status=PUBLISHED')}>All published →</a>
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
												href={resolve(`/show/${content_row.show.number}/${content_row.show.slug}`)}
												target="_blank"
												rel="noopener noreferrer"
											>
												{content_row.title}
											</a>
											<a href={resolve(`/admin/content/podcast/${content_row.show.number}`)}>Edit</a
											>
										{:else if content_row.type === 'VIDEO' && content_row.video}
											<a
												href={content_row.video.url}
												target="_blank"
												rel="noopener noreferrer external"
											>
												{content_row.title}
											</a>
											<a href={resolve(`/admin/content/videos/${content_row.id}`)}>Edit</a>
										{:else if content_row.type === 'ARTICLE'}
											<p>{content_row.title}</p>
											<a href={resolve(`/admin/content/articles/${content_row.id}`)}>Edit</a>
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
