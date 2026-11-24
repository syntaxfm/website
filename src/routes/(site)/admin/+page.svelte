<script lang="ts">
	import { format, formatDistance } from 'date-fns';
	import { resolve } from '$app/paths';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminTable from '#lib/admin/AdminTable.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import {
		to_content_edit_path,
		to_content_public_href,
		type ContentLinkRow
	} from '#lib/admin/content_links.ts';
	import { humanize_enum } from '#lib/utils/format_enum.ts';
	import { get_dashboard } from './admin_dashboard.remote';

	const dashboard = await get_dashboard();
	const today_iso_date_string = format(new Date(), 'yyyy-MM-dd');

	// Long panels show this many rows until opened
	const PANEL_ROWS = 8;
	let open_panels = $state<Record<string, boolean>>({});

	function panel_rows<T>(panel: string, rows: T[]): T[] {
		return open_panels[panel] ? rows : rows.slice(0, PANEL_ROWS);
	}

	function edit_href(content_row: ContentLinkRow) {
		const edit_path = to_content_edit_path(content_row);
		return edit_path ? resolve(edit_path) : null;
	}
</script>

<svelte:head>
	<title>Dashboard | Syntax Admin</title>
</svelte:head>

<!-- One row of a Content table: title (editor + public links), type, date -->
{#snippet content_row(
	row: ContentLinkRow & { title: string },
	date: Date | null,
	show_time: boolean
)}
	<tr>
		<AdminTitleCell
			title={row.title}
			edit_href={edit_href(row)}
			public_href={to_content_public_href(row)}
		/>
		<td class="admin-cell-muted">{humanize_enum(row.type)}</td>
		<AdminDateCell value={date} {show_time} />
	</tr>
{/snippet}

<!-- One row of a Show table: number, title (editor + public links), date -->
{#snippet show_row(row: { number: number; slug: string; title: string; date: Date })}
	<tr>
		<td class="admin-cell-muted">#{row.number}</td>
		<AdminTitleCell
			title={row.title}
			edit_href={resolve(`admin/content/podcast/${row.number}`)}
			public_href={resolve(`show/${row.number}/${row.slug}`)}
		/>
		<AdminDateCell value={row.date} />
	</tr>
{/snippet}

<div class="admin-page stack">
	<div class="admin-stats">
		<a class="admin-stat" href={resolve('admin/submissions?status=PENDING')}>
			<strong>{dashboard.pending_submissions_count.toLocaleString()}</strong>
			Pending submissions
		</a>
		<a class="admin-stat" href={resolve('admin/content?status=DRAFT')}>
			<strong>{dashboard.drafts_count.toLocaleString()}</strong>
			Drafts
		</a>
		<a
			class="admin-stat"
			href={resolve(`admin/content?status=PUBLISHED&date_from=${today_iso_date_string}`)}
		>
			<strong>{dashboard.scheduled_count.toLocaleString()}</strong>
			Scheduled
		</a>
	</div>

	{#if dashboard.submission_breakdown.length > 0}
		<nav class="admin-chips" aria-label="Pending submissions by type">
			{#each dashboard.submission_breakdown as bucket (bucket.submission_type)}
				<a
					href={resolve(
						`admin/submissions?status=PENDING&submission_type=${bucket.submission_type}`
					)}
				>
					{humanize_enum(bucket.submission_type)}
					<strong>{bucket.count}</strong>
				</a>
			{/each}
		</nav>
	{/if}

	<div class="admin-dashboard">
		<section class="admin-panel">
			<h2>Upcoming</h2>
			<a href={resolve(`admin/content?status=PUBLISHED&date_from=${today_iso_date_string}`)}
				>All upcoming →</a
			>
			<AdminTable is_empty={dashboard.upcoming_content.length === 0}>
				{#snippet head()}
					<th>Title</th>
					<th>Type</th>
					<th>Scheduled</th>
				{/snippet}
				{#each dashboard.upcoming_content as row (row.id)}
					{@render content_row(row, row.published_at, true)}
				{/each}
				{#snippet empty()}
					<tr><td colspan="3" class="admin-cell-muted">Nothing scheduled.</td></tr>
				{/snippet}
			</AdminTable>
		</section>

		<section class="admin-panel">
			<h2>Recently published</h2>
			<a href={resolve('admin/content?status=PUBLISHED')}>All published →</a>
			<AdminTable is_empty={dashboard.recently_published.length === 0}>
				{#snippet head()}
					<th>Title</th>
					<th>Type</th>
					<th>Published</th>
				{/snippet}
				{#each dashboard.recently_published as row (row.id)}
					{@render content_row(row, row.published_at, false)}
				{/each}
				{#snippet empty()}
					<tr><td colspan="3" class="admin-cell-muted">Nothing in the last 7 days.</td></tr>
				{/snippet}
			</AdminTable>
		</section>

		<section class="admin-panel">
			<h2>Missing transcript</h2>
			<AdminTable is_empty={dashboard.shows_missing_transcript.length === 0}>
				{#snippet head()}
					<th>#</th>
					<th>Title</th>
					<th>Date</th>
				{/snippet}
				{#each panel_rows('transcript', dashboard.shows_missing_transcript) as row (row.id)}
					{@render show_row(row)}
				{/each}
				{#snippet empty()}
					<tr><td colspan="3" class="admin-cell-muted">All recent shows have one.</td></tr>
				{/snippet}
			</AdminTable>
			{#if dashboard.shows_missing_transcript.length > PANEL_ROWS && !open_panels['transcript']}
				<button
					type="button"
					data-intent="quiet"
					onclick={() => (open_panels['transcript'] = true)}
				>
					Show all {dashboard.shows_missing_transcript.length}
				</button>
			{/if}
		</section>

		<section class="admin-panel">
			<h2>Missing AI notes</h2>
			<AdminTable is_empty={dashboard.shows_missing_ai_notes.length === 0}>
				{#snippet head()}
					<th>#</th>
					<th>Title</th>
					<th>Date</th>
				{/snippet}
				{#each panel_rows('ai_notes', dashboard.shows_missing_ai_notes) as row (row.id)}
					{@render show_row(row)}
				{/each}
				{#snippet empty()}
					<tr><td colspan="3" class="admin-cell-muted">All recent shows have them.</td></tr>
				{/snippet}
			</AdminTable>
			{#if dashboard.shows_missing_ai_notes.length > PANEL_ROWS && !open_panels['ai_notes']}
				<button type="button" data-intent="quiet" onclick={() => (open_panels['ai_notes'] = true)}>
					Show all {dashboard.shows_missing_ai_notes.length}
				</button>
			{/if}
		</section>

		<section class="admin-panel">
			<h2>Stale drafts</h2>
			<AdminTable is_empty={dashboard.stale_drafts.length === 0}>
				{#snippet head()}
					<th>Title</th>
					<th>Type</th>
					<th>Last updated</th>
				{/snippet}
				{#each panel_rows('stale', dashboard.stale_drafts) as row (row.id)}
					{@render content_row(row, row.updated_at, false)}
				{/each}
				{#snippet empty()}
					<tr><td colspan="3" class="admin-cell-muted">No drafts older than 14 days.</td></tr>
				{/snippet}
			</AdminTable>
			{#if dashboard.stale_drafts.length > PANEL_ROWS && !open_panels['stale']}
				<button type="button" data-intent="quiet" onclick={() => (open_panels['stale'] = true)}>
					Show all {dashboard.stale_drafts.length}
				</button>
			{/if}
		</section>
	</div>

	<section class="admin-panel">
		<h2>Last 7 days</h2>
		<AdminTable is_empty={dashboard.activity.length === 0}>
			{#snippet head()}
				<th>What</th>
				<th>When</th>
			{/snippet}
			{#each panel_rows('activity', dashboard.activity) as item (item.kind === 'content' ? `c-${item.content_id}-${item.timestamp.getTime()}` : `s-${item.submission_id}`)}
				<tr>
					{#if item.kind === 'content'}
						{@const row = {
							id: item.content_id,
							type: item.content_type,
							show: item.show,
							video: item.video
						}}
						<AdminTitleCell
							title={item.title}
							edit_href={edit_href(row)}
							public_href={to_content_public_href(row)}
							detail={`${item.was_published ? 'Published' : 'Updated'} · ${humanize_enum(item.content_type)}`}
						/>
					{:else}
						<AdminTitleCell
							title={item.submitter_name || 'Anon'}
							edit_href={resolve(
								`admin/submissions?status=PENDING&submission_type=${item.submission_type}`
							)}
							detail={`Submission · ${humanize_enum(item.submission_type)}`}
						/>
					{/if}
					<td class="admin-cell-muted admin-cell-date">
						{formatDistance(item.timestamp, new Date(), { addSuffix: true })}
					</td>
				</tr>
			{/each}
			{#snippet empty()}
				<tr><td colspan="2" class="admin-cell-muted">Nothing happened.</td></tr>
			{/snippet}
		</AdminTable>
		{#if dashboard.activity.length > PANEL_ROWS && !open_panels['activity']}
			<button type="button" data-intent="quiet" onclick={() => (open_panels['activity'] = true)}>
				Show all {dashboard.activity.length}
			</button>
		{/if}
	</section>
</div>
