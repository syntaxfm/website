<script lang="ts">
	import { format } from 'date-fns';
	import { error_message } from '#lib/utils/error_message.ts';
	import { get_seo_dashboard, run_seo_snapshot } from './admin_seo.remote';
	import {
		format_change,
		format_count,
		format_page,
		format_position,
		format_position_move,
		format_result_types
	} from './seo_format';

	type Feedback = { tone: 'positive' | 'negative'; message: string };

	let dashboard = $derived(await get_seo_dashboard());
	let is_running = $state(false);
	let run_feedback = $state<Feedback | null>(null);

	let google_moves = $derived(
		new Map(dashboard.comparison?.google.map((move) => [move.search, move]) ?? [])
	);
	let youtube_moves = $derived(
		new Map(dashboard.comparison?.youtube.map((move) => [move.search, move]) ?? [])
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
							message: `Saved with ${result.error_count} failed calls · ${result.credits_cost} credits`
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

<div class="admin-page stack">
	<div class="admin-control-row">
		<button
			type="button"
			data-intent="primary"
			onclick={take_snapshot}
			disabled={!dashboard.is_online || is_running}
		>
			{is_running ? 'Taking snapshot…' : 'Take snapshot'}
		</button>
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
	</div>

	{#if dashboard.latest}
		{@const { report, errors, taken_at } = dashboard.latest}
		{@const comparison = dashboard.comparison}

		<section class="admin-section">
			<h2 class="h5">Snapshot {format(taken_at, 'MMM d, yyyy HH:mm')}</h2>
			<dl class="admin-source-facts">
				{#if report.overview}
					<dt>Google keywords</dt>
					<dd>
						{format_count(report.overview.keyword_count)}
						<span class="fs-1">{format_change(comparison?.keyword_count_change ?? null)}</span>
					</dd>
					<dt>Visits a month (estimate)</dt>
					<dd>
						{format_count(report.overview.estimated_traffic)}
						<span class="fs-1">{format_change(comparison?.traffic_change ?? null)}</span>
					</dd>
					<dt>In the top 3</dt>
					<dd>{format_count(report.overview.bands.pos_1 + report.overview.bands.pos_2_3)}</dd>
					<dt>On page 1</dt>
					<dd>
						{format_count(
							report.overview.bands.pos_1 +
								report.overview.bands.pos_2_3 +
								report.overview.bands.pos_4_10
						)}
					</dd>
				{/if}
				{#if report.backlinks}
					<dt>Sites linking to syntax.fm</dt>
					<dd>{format_count(report.backlinks.referring_domains)}</dd>
				{/if}
				{#if errors.length > 0}
					<dt>Failed calls</dt>
					<dd>{errors.length}</dd>
				{/if}
			</dl>
		</section>

		<section class="admin-section">
			<h2 class="h5">Tracked searches on Google</h2>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Search</th>
							<th>Syntax</th>
							<th>Change</th>
							<th>On the page</th>
							<th>Top 3</th>
						</tr>
					</thead>
					<tbody>
						{#each report.google_searches as check (check.search)}
							{@const move = google_moves.get(check.search)}
							<tr>
								<td>{check.search}</td>
								<td title={check.syntax_title ?? undefined}>
									{format_position(check.syntax_position)}
								</td>
								<td>
									{move ? format_position_move(move.from, move.to, move.was_tracked) : ''}
								</td>
								<td class="fs-1">{format_result_types(check.result_types)}</td>
								<td class="fs-1">{check.top_sites.join(', ')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<section class="admin-section">
			<h2 class="h5">Tracked searches on YouTube</h2>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Search</th>
							<th>Syntax</th>
							<th>Change</th>
							<th>Syntax video</th>
							<th>Top 3 channels</th>
						</tr>
					</thead>
					<tbody>
						{#each report.youtube_searches as check (check.search)}
							{@const move = youtube_moves.get(check.search)}
							<tr>
								<td>{check.search}</td>
								<td>{format_position(check.syntax_position)}</td>
								<td>
									{move ? format_position_move(move.from, move.to, move.was_tracked) : ''}
								</td>
								<td class="fs-1">
									{#if check.syntax_video_url}
										<a
											href={check.syntax_video_url}
											target="_blank"
											rel="noopener noreferrer external"
											>{check.syntax_video_title ?? check.syntax_video_url}</a
										>
									{/if}
								</td>
								<td class="fs-1">{check.top_channels.join(', ')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		{#if dashboard.opportunities}
			<section class="admin-section">
				<h2 class="h5">Close to the top: Syntax topics at #4–20 on Google</h2>
				{#if dashboard.opportunities.on_topic.length === 0}
					<p class="fs-2">None right now.</p>
				{:else}
					<div class="table-container">
						<table>
							<thead>
								<tr>
									<th>Keyword</th>
									<th>Searches a month</th>
									<th>Position</th>
									<th>Difficulty</th>
									<th>Page</th>
								</tr>
							</thead>
							<tbody>
								{#each dashboard.opportunities.on_topic as keyword (keyword.keyword)}
									<tr>
										<td>{keyword.keyword}</td>
										<td>{format_count(keyword.search_volume)}</td>
										<td>{format_position(keyword.position)}</td>
										<td>{format_count(keyword.keyword_difficulty)}</td>
										<td class="fs-1">
											<a href={keyword.url} target="_blank" rel="noopener noreferrer"
												>{format_page(keyword.url)}</a
											>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
				{#if dashboard.opportunities.off_topic_count > 0}
					<p class="fs-1">
						{dashboard.opportunities.off_topic_count} more aren't about a Syntax topic
					</p>
				{/if}
			</section>
		{/if}

		{#if comparison && dashboard.previous_taken_at}
			{@const change_lists = [
				{ title: 'New keywords', moves: comparison.gained },
				{ title: 'Lost keywords', moves: comparison.lost },
				{ title: 'Moved up', moves: comparison.improved },
				{ title: 'Moved down', moves: comparison.declined }
			]}
			<section class="admin-section">
				<h2 class="h5">
					Since {format(dashboard.previous_taken_at, 'MMM d, yyyy')}
				</h2>
				{#each change_lists as list (list.title)}
					<details>
						<summary>{list.title} ({list.moves.length})</summary>
						<div class="table-container">
							<table>
								<thead>
									<tr>
										<th>Keyword</th>
										<th>Searches a month</th>
										<th>Was</th>
										<th>Now</th>
									</tr>
								</thead>
								<tbody>
									{#each list.moves as move (move.keyword)}
										<tr>
											<td>{move.keyword}</td>
											<td>{format_count(move.search_volume)}</td>
											<td>{format_position(move.from)}</td>
											<td>{format_position(move.to)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</details>
				{/each}
			</section>
		{/if}

		{#if report.competitors.length > 0}
			<section class="admin-section">
				<h2 class="h5">Sites ranking for the same keywords</h2>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>Site</th>
								<th>Shared keywords</th>
								<th>Their average position</th>
							</tr>
						</thead>
						<tbody>
							{#each report.competitors as competitor (competitor.domain)}
								<tr>
									<td>{competitor.domain}</td>
									<td>{format_count(competitor.shared_keywords)}</td>
									<td>{format_position(Math.round(competitor.average_position))}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}

		<section class="admin-section">
			<details>
				<summary>All {report.keywords.length} Google keywords</summary>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>Keyword</th>
								<th>Searches a month</th>
								<th>Position</th>
								<th>Intent</th>
								<th>Page</th>
							</tr>
						</thead>
						<tbody>
							{#each report.keywords as keyword (keyword.keyword)}
								<tr>
									<td>{keyword.keyword}</td>
									<td>{format_count(keyword.search_volume)}</td>
									<td>{format_position(keyword.position)}</td>
									<td class="fs-1">{keyword.intent ?? ''}</td>
									<td class="fs-1">
										<a href={keyword.url} target="_blank" rel="noopener noreferrer"
											>{format_page(keyword.url)}</a
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</details>
		</section>

		{#if errors.length > 0}
			<section class="admin-section">
				<h2 class="h5">Failed calls</h2>
				<ul>
					{#each errors as call_error, index (index)}
						<li class="fs-2">
							{call_error.capability} · {call_error.subject}: {call_error.message}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{:else}
		<p class="fs-2">No snapshots yet.</p>
	{/if}

	{#if dashboard.history.length > 0}
		<section class="admin-section">
			<h2 class="h5">Snapshots</h2>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Taken</th>
							<th>Credits</th>
							<th>Failed calls</th>
						</tr>
					</thead>
					<tbody>
						{#each dashboard.history as row (row.id)}
							<tr>
								<td>{format(row.taken_at, 'MMM d, yyyy HH:mm')}</td>
								<td>{format_count(row.credits_cost)}</td>
								<td>{row.error_count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
