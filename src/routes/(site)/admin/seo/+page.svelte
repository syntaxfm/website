<script lang="ts">
	import { format } from 'date-fns';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import AdminTable from '#lib/admin/AdminTable.svelte';
	import { error_message } from '#lib/utils/error_message.ts';
	import { get_seo_dashboard, run_seo_snapshot } from './admin_seo.remote';
	import BarList from './BarList.svelte';
	import RankChip from './RankChip.svelte';
	import {
		build_stat_tiles,
		build_tracked_rows,
		group_tracked_rows,
		position_band_rows,
		search_term_rows
	} from './seo_charts';
	import StatTiles from './StatTiles.svelte';
	import TrackedSearchTable from './TrackedSearchTable.svelte';
	import {
		format_count,
		format_page,
		format_percent,
		format_position,
		format_position_move,
		format_result_types,
		format_volume
	} from './seo_format';

	type Feedback = { tone: 'positive' | 'negative'; message: string };

	let dashboard = $derived(await get_seo_dashboard());
	let is_running = $state(false);
	let run_feedback = $state<Feedback | null>(null);

	// Rows a long list shows before "Show all"
	const LIST_ROWS = 6;
	const OPPORTUNITY_ROWS = 10;
	let open_lists = $state<Record<string, boolean>>({});

	function visible<T>(key: string, rows: readonly T[], limit = LIST_ROWS): readonly T[] {
		return open_lists[key] ? rows : rows.slice(0, limit);
	}

	let stat_tiles = $derived(build_stat_tiles(dashboard.history));
	let tracked_groups = $derived(
		dashboard.latest
			? group_tracked_rows(
					build_tracked_rows(dashboard.latest.report, dashboard.history),
					dashboard.tracked_groups
				)
			: []
	);
	let google_moves = $derived(
		new Map(dashboard.comparison?.google.map((move) => [move.search, move]) ?? [])
	);
	let youtube_moves = $derived(
		new Map(dashboard.comparison?.youtube.map((move) => [move.search, move]) ?? [])
	);
	let spotify_show_moves = $derived(
		new Map(dashboard.comparison?.spotify_shows.map((move) => [move.search, move]) ?? [])
	);
	let spotify_episode_moves = $derived(
		new Map(dashboard.comparison?.spotify_episodes.map((move) => [move.search, move]) ?? [])
	);

	let header_detail = $derived(
		dashboard.latest
			? [
					`Snapshot ${format(dashboard.latest.taken_at, 'MMM d, yyyy HH:mm')}`,
					dashboard.previous_taken_at
						? `compared with ${format(dashboard.previous_taken_at, 'MMM d')}`
						: null
				]
					.filter(Boolean)
					.join(' · ')
			: 'No snapshots yet'
	);

	let sections = $derived(
		dashboard.latest
			? [
					...(dashboard.comparison ? [{ id: 'seo-changes', label: 'Changes' }] : []),
					{ id: 'seo-tracked', label: 'Tracked searches' },
					{ id: 'seo-opportunities', label: 'Close to the top' },
					...(dashboard.latest.report.youtube_search_terms
						? [{ id: 'seo-youtube', label: 'YouTube searches' }]
						: []),
					{ id: 'seo-keywords', label: 'Keywords & competitors' },
					{ id: 'seo-raw', label: 'Raw data' }
				]
			: []
	);

	async function take_snapshot(): Promise<void> {
		if (is_running) return;
		is_running = true;
		run_feedback = null;
		try {
			const result = await run_seo_snapshot();
			run_feedback =
				result.error_count > 0
					? {
							tone: 'negative',
							message: `Saved with ${result.error_count} failed ${result.error_count === 1 ? 'call' : 'calls'} · ${result.credits_cost} credits`
						}
					: { tone: 'positive', message: `Saved · ${result.credits_cost} credits` };
		} catch (snapshot_error) {
			console.error('Unable to take an SEO snapshot', snapshot_error);
			run_feedback = {
				tone: 'negative',
				message: error_message(snapshot_error, 'Unable to take an SEO snapshot.')
			};
		} finally {
			is_running = false;
		}
	}
</script>

<svelte:head>
	<title>SEO | Syntax Admin</title>
</svelte:head>

{#snippet show_all(key: string, total: number, limit: number = LIST_ROWS)}
	{#if total > limit && !open_lists[key]}
		<button type="button" onclick={() => (open_lists[key] = true)}>Show all {total}</button>
	{/if}
{/snippet}

<div class="admin-page stack">
	<AdminEditorHeader title="SEO" detail={header_detail} {sections}>
		{#snippet actions()}
			<button
				type="button"
				data-intent="primary"
				onclick={take_snapshot}
				disabled={!dashboard.is_online || is_running}
			>
				{is_running ? 'Taking snapshot…' : 'Take snapshot'}
			</button>
		{/snippet}
	</AdminEditorHeader>

	{#if !dashboard.is_online}
		<p class="admin-feedback" data-tone="negative" role="status">
			Offline: FIRECRAWL_API_KEY isn't set
		</p>
	{/if}
	{#if run_feedback}
		<p
			class="admin-feedback"
			data-tone={run_feedback.tone}
			role={run_feedback.tone === 'negative' ? 'alert' : 'status'}
		>
			{run_feedback.message}
		</p>
	{/if}

	{#if dashboard.latest}
		{@const { report, errors } = dashboard.latest}
		{@const comparison = dashboard.comparison}

		<StatTiles tiles={stat_tiles} />

		{#if errors.length > 0}
			<p class="admin-feedback" data-tone="negative">
				{errors.length}
				{errors.length === 1 ? 'call' : 'calls'} failed, so some numbers are missing ·
				<a href="#seo-failed">See which</a>
			</p>
		{/if}

		{#if comparison}
			{@const change_lists = [
				{ key: 'gained', title: 'New keywords', moves: comparison.gained },
				{ key: 'lost', title: 'Lost keywords', moves: comparison.lost },
				{ key: 'improved', title: 'Moved up', moves: comparison.improved },
				{ key: 'declined', title: 'Moved down', moves: comparison.declined }
			]}
			<section id="seo-changes" class="stack">
				<h2>What changed</h2>
				<div class="admin-dashboard seo-changes">
					{#each change_lists as list (list.key)}
						<section class="admin-panel" data-change={list.key}>
							<h3>{list.title} <span class="admin-cell-muted">{list.moves.length}</span></h3>
							<AdminTable is_empty={list.moves.length === 0}>
								{#snippet head()}
									<th>Keyword</th>
									<th class="admin-cell-number">Searches</th>
									<th>Position</th>
								{/snippet}
								{#each visible(list.key, list.moves) as move (move.keyword)}
									<tr>
										<td class="admin-cell-title">{move.keyword}</td>
										<td class="admin-cell-number admin-cell-muted"
											>{format_volume(move.search_volume)}</td
										>
										<td class="seo-move">
											{#if move.from !== null}
												<span class="admin-cell-muted">{format_position(move.from)} →</span>
											{/if}
											<RankChip position={move.to} />
										</td>
									</tr>
								{/each}
								{#snippet empty()}
									<tr><td colspan="3" class="admin-cell-muted">None</td></tr>
								{/snippet}
							</AdminTable>
							{@render show_all(list.key, list.moves.length)}
						</section>
					{/each}
				</div>
			</section>
		{/if}

		<section id="seo-tracked" class="stack">
			<h2>Tracked searches</h2>
			<TrackedSearchTable
				groups={tracked_groups}
				max_position={dashboard.max_position}
				moves={comparison}
			/>
		</section>

		{#if dashboard.opportunities}
			{@const opportunities = dashboard.opportunities}
			<section id="seo-opportunities" class="admin-panel">
				<h2>Close to the top</h2>
				<AdminTable is_empty={opportunities.on_topic.length === 0}>
					{#snippet head()}
						<th>Google</th>
						<th>Keyword</th>
						<th class="admin-cell-number">Searches/mo</th>
						<th class="admin-cell-number">Difficulty</th>
					{/snippet}
					{#each visible('opportunities', opportunities.on_topic, OPPORTUNITY_ROWS) as keyword (keyword.keyword)}
						<tr>
							<td data-label="Google"
								><RankChip position={keyword.position} href={keyword.url} /></td
							>
							<td class="admin-cell-title">
								{keyword.keyword}
								<small>{format_page(keyword.url)}</small>
							</td>
							<td class="admin-cell-number" data-label="Searches/mo"
								>{format_count(keyword.search_volume)}</td
							>
							<td class="admin-cell-number" data-label="Difficulty"
								>{format_count(keyword.keyword_difficulty)}</td
							>
						</tr>
					{/each}
					{#snippet empty()}
						<tr><td colspan="4" class="admin-cell-muted">None</td></tr>
					{/snippet}
				</AdminTable>
				{@render show_all('opportunities', opportunities.on_topic.length, OPPORTUNITY_ROWS)}
				{#if opportunities.off_topic_count > 0}
					<p class="admin-cell-muted seo-note">
						+{opportunities.off_topic_count} off-topic
					</p>
				{/if}
			</section>
		{/if}

		{#if report.youtube_search_terms}
			{@const search_terms = report.youtube_search_terms}
			<section id="seo-youtube" class="stack">
				<h2>YouTube searches that found Syntax</h2>
				<p class="admin-cell-muted">
					{search_terms.start_date} to {search_terms.end_date} ·
					{format_percent(
						search_terms.total_views > 0
							? search_terms.search_views / search_terms.total_views
							: null
					)} of views came from search
				</p>
				<BarList rows={search_term_rows(search_terms.terms)} />
				<details>
					<summary>By video ({search_terms.videos.length})</summary>
					<AdminTable>
						{#snippet head()}
							<th>Video</th>
							<th class="admin-cell-number">Views from search</th>
							<th>Top searches</th>
						{/snippet}
						{#each search_terms.videos as video (video.video_id)}
							<tr>
								<td class="admin-cell-title">
									<a
										href={`https://www.youtube.com/watch?v=${video.video_id}`}
										target="_blank"
										rel="noopener noreferrer external">{video.title ?? video.video_id}</a
									>
								</td>
								<td class="admin-cell-number" data-label="Views from search"
									>{format_count(video.search_views)}</td
								>
								<td>{video.terms.map((term) => `${term.term} (${term.views})`).join(', ')}</td>
							</tr>
						{/each}
					</AdminTable>
				</details>
			</section>
		{/if}

		<div id="seo-keywords" class="admin-dashboard">
			{#if report.overview}
				<section class="admin-panel">
					<h2>{format_count(report.overview.keyword_count)} Google keywords by position</h2>
					<div class="seo-panel-body">
						<BarList rows={position_band_rows(report.overview)} />
					</div>
				</section>
			{/if}

			{#if report.competitors.length > 0}
				<section class="admin-panel">
					<h2>Sites ranking for the same keywords</h2>
					<AdminTable>
						{#snippet head()}
							<th>Site</th>
							<th class="admin-cell-number">Shared</th>
							<th class="admin-cell-number">Their average</th>
						{/snippet}
						{#each report.competitors as competitor (competitor.domain)}
							<tr>
								<td class="admin-cell-title">{competitor.domain}</td>
								<td class="admin-cell-number" data-label="Shared"
									>{format_count(competitor.shared_keywords)}</td
								>
								<td class="admin-cell-number" data-label="Their average"
									>{format_position(Math.round(competitor.average_position))}</td
								>
							</tr>
						{/each}
					</AdminTable>
				</section>
			{/if}
		</div>

		<section id="seo-raw" class="stack">
			<h2>Raw data</h2>

			<details>
				<summary>Google results ({report.google_searches.length})</summary>
				<AdminTable>
					{#snippet head()}
						<th>Search</th>
						<th>Syntax</th>
						<th>Syntax page</th>
						<th>Video box</th>
						<th>On the page</th>
						<th>Top 3</th>
					{/snippet}
					{#each report.google_searches as check (check.search)}
						{@const move = google_moves.get(check.search)}
						<tr>
							<td class="admin-cell-title">{check.search}</td>
							<td data-label="Syntax">
								<RankChip
									position={check.syntax_position}
									move={move ? format_position_move(move.from, move.to, move.was_tracked) : ''}
									title={check.syntax_title ?? undefined}
								/>
							</td>
							<td>
								{#if check.syntax_url}
									<a href={check.syntax_url} target="_blank" rel="noopener noreferrer"
										>{format_page(check.syntax_url)}</a
									>
								{:else if check.syntax_site}
									{check.syntax_site}: {check.syntax_title}
								{/if}
							</td>
							<td>
								{#if check.syntax_video_box}
									{@const box = check.syntax_video_box}
									{#if box.url}
										<a href={box.url} target="_blank" rel="noopener noreferrer external"
											>#{box.position} {box.title}</a
										>
									{:else}
										#{box.position} {box.title}
									{/if}
								{/if}
							</td>
							<td>{format_result_types(check.result_types)}</td>
							<td>{check.top_sites.join(', ')}</td>
						</tr>
					{/each}
				</AdminTable>
			</details>

			<details>
				<summary>YouTube results ({report.youtube_searches.length})</summary>
				<AdminTable>
					{#snippet head()}
						<th>Search</th>
						<th>Syntax</th>
						<th>Syntax video</th>
						<th>Top 3 channels</th>
					{/snippet}
					{#each report.youtube_searches as check (check.search)}
						{@const move = youtube_moves.get(check.search)}
						<tr>
							<td class="admin-cell-title">{check.search}</td>
							<td data-label="Syntax">
								<RankChip
									position={check.syntax_position}
									move={move ? format_position_move(move.from, move.to, move.was_tracked) : ''}
								/>
							</td>
							<td>
								{#if check.syntax_video_url}
									<a
										href={check.syntax_video_url}
										target="_blank"
										rel="noopener noreferrer external"
										>{check.syntax_video_title ?? check.syntax_video_url}</a
									>
								{/if}
							</td>
							<td>{check.top_channels.join(', ')}</td>
						</tr>
					{/each}
				</AdminTable>
			</details>

			{#if report.spotify_searches}
				<details>
					<summary>Spotify results ({report.spotify_searches.length})</summary>
					<AdminTable>
						{#snippet head()}
							<th>Search</th>
							<th>Show</th>
							<th>Best episode</th>
							<th>Syntax episode</th>
							<th>Top 3 shows</th>
						{/snippet}
						{#each report.spotify_searches as check (check.search)}
							{@const show_move = spotify_show_moves.get(check.search)}
							{@const episode_move = spotify_episode_moves.get(check.search)}
							<tr>
								<td class="admin-cell-title">{check.search}</td>
								<td data-label="Show">
									<RankChip
										position={check.syntax_show_position}
										move={show_move
											? format_position_move(show_move.from, show_move.to, show_move.was_tracked)
											: ''}
									/>
								</td>
								<td data-label="Episode">
									<RankChip
										position={check.syntax_episode_position}
										move={episode_move
											? format_position_move(
													episode_move.from,
													episode_move.to,
													episode_move.was_tracked
												)
											: ''}
									/>
								</td>
								<td>
									{#if check.syntax_episode_url}
										<a
											href={check.syntax_episode_url}
											target="_blank"
											rel="noopener noreferrer external"
											>{check.syntax_episode_title ?? check.syntax_episode_url}</a
										>
									{/if}
								</td>
								<td>{check.top_shows.join(', ')}</td>
							</tr>
						{/each}
					</AdminTable>
				</details>
			{/if}

			<details>
				<summary>All Google keywords ({report.keywords.length})</summary>
				<AdminTable>
					{#snippet head()}
						<th>Google</th>
						<th>Keyword</th>
						<th class="admin-cell-number">Searches/mo</th>
						<th>Intent</th>
					{/snippet}
					{#each report.keywords as keyword (keyword.keyword)}
						<tr>
							<td data-label="Google"
								><RankChip position={keyword.position} href={keyword.url} /></td
							>
							<td class="admin-cell-title">
								{keyword.keyword}
								<small>{format_page(keyword.url)}</small>
							</td>
							<td class="admin-cell-number" data-label="Searches/mo"
								>{format_count(keyword.search_volume)}</td
							>
							<td>{keyword.intent ?? ''}</td>
						</tr>
					{/each}
				</AdminTable>
			</details>

			{#if errors.length > 0}
				<details id="seo-failed" open>
					<summary>Failed calls ({errors.length})</summary>
					<ul>
						{#each errors as call_error, index (index)}
							<li>{call_error.capability} · {call_error.subject}: {call_error.message}</li>
						{/each}
					</ul>
				</details>
			{/if}

			{#if dashboard.history.length > 0}
				<details>
					<summary>Snapshots ({dashboard.history.length})</summary>
					<AdminTable>
						{#snippet head()}
							<th>Taken</th>
							<th class="admin-cell-number">Credits</th>
							<th class="admin-cell-number">Failed calls</th>
						{/snippet}
						{#each dashboard.history as row (row.id)}
							<tr>
								<td class="admin-cell-title">{format(row.taken_at, 'MMM d, yyyy HH:mm')}</td>
								<td class="admin-cell-number" data-label="Credits"
									>{format_count(row.credits_cost)}</td
								>
								<td class="admin-cell-number" data-label="Failed">{row.error_count}</td>
							</tr>
						{/each}
					</AdminTable>
				</details>
			{/if}
		</section>
	{/if}
</div>

<style>
	.seo-changes {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
	}

	.seo-move {
		white-space: nowrap;
	}

	.seo-panel-body,
	.seo-note {
		grid-column: 1 / -1;
	}

	.seo-note {
		font-size: var(--fs-2);
	}
</style>
