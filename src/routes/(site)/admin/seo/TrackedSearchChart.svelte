<script lang="ts">
	import { position_percent, type TrackedPlacement, type TrackedRow } from './seo_charts';
	import {
		format_count,
		format_page,
		format_position,
		format_volume,
		format_volume_trend
	} from './seo_format';
	import PositionHistory from './PositionHistory.svelte';

	// Each tracked search's position on Google, on YouTube and among Spotify's episodes, #1 on the
	// left on a log scale.
	// Searches where Syntax isn't in the results get a hollow marker in the next column, and the
	// last column shows positions across snapshots.

	let {
		rows,
		max_position
	}: {
		rows: TrackedRow[];
		max_position: {
			google: number;
			youtube: number;
			spotify_show: number;
			spotify_episode: number;
		};
	} = $props();

	const TICKS = [1, 3, 10, 20, 50, 100];
	// The track runs to Google's depth; YouTube results stop well before it
	let track_max = $derived(max_position.google);

	type Platform = TrackedPlacement & {
		key: 'google' | 'youtube' | 'spotify';
		name: string;
		depth: number;
		marker_title: string;
	};

	function marker_title(platform: Omit<Platform, 'marker_title'>, row: TrackedRow): string {
		if (platform.key === 'spotify') {
			const show =
				row.spotify_show_position === null
					? `show not in the top ${max_position.spotify_show}`
					: `show ${format_position(row.spotify_show_position)}`;
			const episode =
				platform.position === null
					? `no episode in the top ${platform.depth}`
					: `episode ${format_position(platform.position)}`;
			return [`Spotify: ${episode}, ${show}`, platform.title].filter(Boolean).join(' · ');
		}
		if (platform.position === null) return `${platform.name}: not in the top ${platform.depth}`;
		const page = platform.key === 'google' && platform.url ? format_page(platform.url) : null;
		return [`${platform.name}: ${format_position(platform.position)}`, page ?? platform.title]
			.filter(Boolean)
			.join(' · ');
	}

	let chart_rows = $derived(
		rows.map((row) => {
			const placements: Omit<Platform, 'marker_title'>[] = [
				{ ...row.google, key: 'google', name: 'Google', depth: max_position.google },
				{ ...row.youtube, key: 'youtube', name: 'YouTube', depth: max_position.youtube },
				...(row.spotify
					? [
							{
								...row.spotify,
								key: 'spotify' as const,
								name: 'Spotify episode',
								depth: max_position.spotify_episode
							}
						]
					: [])
			];
			const platforms: Platform[] = placements.map((platform) => ({
				...platform,
				marker_title: marker_title(platform, row)
			}));
			const demand = row.demand
				? [
						`${format_volume(row.demand.search_volume)} a month`,
						`difficulty ${format_count(row.demand.keyword_difficulty)}`,
						format_volume_trend(row.demand.monthly)
					]
						.filter(Boolean)
						.join(' · ')
				: '';
			const summary = platforms
				.map(
					(platform) =>
						`${platform.name} ${platform.position === null ? 'not found' : format_position(platform.position)}`
				)
				.join(', ');
			const has_history =
				row.google_history.length > 1 &&
				[...row.google_history, ...row.youtube_history, ...row.spotify_history].some(
					(position) => position !== null
				);
			return { ...row, platforms, demand, summary, has_history };
		})
	);
</script>

<div class="tracked-chart">
	<ul class="tracked-legend">
		<li><span class="marker google"></span>Google</li>
		<li><span class="marker youtube"></span>YouTube</li>
		<li><span class="marker spotify"></span>Spotify episode</li>
		<li><span class="marker google missing"></span>Not found</li>
	</ul>

	<div class="tracked-row tracked-axis" aria-hidden="true">
		<span></span>
		<span class="tracked-track">
			{#each TICKS as tick (tick)}
				<span class="tick-label" style:inset-inline-start="{position_percent(tick, track_max)}%"
					>#{tick}</span
				>
			{/each}
		</span>
		<span></span>
		<span></span>
	</div>

	<ul class="tracked-rows">
		{#each chart_rows as row (row.search)}
			<li class="tracked-row" aria-label={`${row.search}: ${row.summary}`}>
				<span class="tracked-search">
					<span>{row.search}</span>
					{#if row.demand}
						<span class="tracked-demand">{row.demand}</span>
					{/if}
				</span>
				<span class="tracked-track" aria-hidden="true">
					{#each TICKS as tick (tick)}
						<span class="tick" style:inset-inline-start="{position_percent(tick, track_max)}%"
						></span>
					{/each}
					{#each row.platforms as platform (platform.key)}
						{#if platform.position !== null}
							<span
								class="marker-hit {platform.key}"
								style:inset-inline-start="{position_percent(platform.position, track_max)}%"
								title={platform.marker_title}
							>
								<span class="marker {platform.key}"></span>
							</span>
						{/if}
					{/each}
				</span>
				<span class="tracked-missing" aria-hidden="true">
					{#each row.platforms as platform (platform.key)}
						{#if platform.position === null}
							<span class="marker {platform.key} missing" title={platform.marker_title}></span>
						{/if}
					{/each}
				</span>
				<span class="tracked-history">
					{#if row.has_history}
						<PositionHistory
							google={row.google_history}
							youtube={row.youtube_history}
							spotify={row.spotify_history}
							max={track_max}
							label={`${row.search} over the last ${row.google_history.length} snapshots`}
						/>
					{/if}
				</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.tracked-chart {
		container-type: inline-size;
		display: grid;
		gap: var(--pad-small);
	}

	.tracked-legend,
	.tracked-rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tracked-legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--pad-medium);
		font-size: var(--fs-2);

		li {
			display: flex;
			align-items: center;
			gap: var(--pad-xsmall);
		}
	}

	.tracked-row {
		display: grid;
		grid-template-columns: minmax(10rem, 17rem) minmax(0, 1fr) 3rem 72px;
		align-items: center;
		gap: var(--pad-small);
		min-block-size: 40px;
		font-size: var(--fs-2);
	}

	.tracked-search {
		display: grid;
		padding-block: var(--pad-xsmall);
	}

	.tracked-demand {
		font-size: var(--fs-1);
		color: var(--admin-muted);
		font-variant-numeric: tabular-nums;
	}

	.tracked-rows {
		display: grid;
	}

	.tracked-rows .tracked-row {
		border-block-start: 1px solid var(--admin-border);
	}

	.tracked-axis {
		min-block-size: auto;
		color: var(--admin-muted);
	}

	.tracked-track {
		position: relative;
		display: block;
		block-size: 28px;
		/* Room so #1 and #20 markers aren't cut at the edges */
		margin-inline: 12px;
	}

	.tracked-axis .tracked-track {
		block-size: 1.5em;
	}

	.tick,
	.tick-label,
	.marker-hit {
		position: absolute;
		translate: -50% 0;
	}

	.tick {
		inset-block: 0;
		inline-size: 1px;
		background: var(--admin-border);
	}

	.tick-label {
		inset-block-start: 0;
		font-variant-numeric: tabular-nums;
	}

	/* A 24px hover target around each 10px marker */
	.marker-hit {
		display: grid;
		place-items: center;
		inline-size: 24px;
		block-size: 24px;
	}

	.marker-hit.google {
		inset-block-start: -6px;
	}

	.marker-hit.youtube {
		inset-block-end: -6px;
	}

	.marker-hit.spotify {
		inset-block-start: 2px;
	}

	.marker {
		display: inline-block;
		flex: none;
		inline-size: 10px;
		block-size: 10px;
		box-shadow: 0 0 0 2px var(--c-bg);
	}

	/* Shape tells them apart without color: Google round, YouTube square, Spotify a diamond */
	.marker.google {
		background: var(--c-chart-1);
		border-radius: 50%;
	}

	.marker.youtube {
		background: var(--c-chart-2);
		border-radius: 2px;
	}

	.marker.spotify {
		inline-size: 8px;
		block-size: 8px;
		background: var(--c-chart-3);
		rotate: 45deg;
	}

	.marker.missing {
		background: transparent;
		border: 2px solid var(--c-chart-1);
	}

	.marker.youtube.missing {
		border-color: var(--c-chart-2);
	}

	.marker.spotify.missing {
		border-color: var(--c-chart-3);
	}

	.tracked-missing {
		display: flex;
		gap: var(--pad-xsmall);
	}

	@container (width < 40rem) {
		.tracked-row {
			grid-template-columns: minmax(0, 1fr) 3rem 72px;
		}

		.tracked-search {
			grid-column: 1 / -1;
		}

		.tracked-axis > span:first-child {
			display: none;
		}
	}
</style>
