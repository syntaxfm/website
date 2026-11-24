<script lang="ts">
	import AdminTable from '#lib/admin/AdminTable.svelte';
	import type { SearchMove } from '$server/seo_tracker/seo_compare';
	import PositionHistory from './PositionHistory.svelte';
	import RankChip from './RankChip.svelte';
	import type { TrackedRow } from './seo_charts';
	import {
		format_count,
		format_page,
		format_position,
		format_position_move,
		format_volume,
		format_volume_trend
	} from './seo_format';

	// Every tracked search under its topic: where Syntax ranks on Google, YouTube and Spotify, how
	// that moved since the last snapshot, and the positions across snapshots

	let {
		groups,
		max_position,
		moves
	}: {
		groups: { label: string; rows: TrackedRow[] }[];
		max_position: {
			google: number;
			youtube: number;
			spotify_episode: number;
		};
		moves: {
			google: SearchMove[];
			youtube: SearchMove[];
			spotify_episodes: SearchMove[];
		} | null;
	} = $props();

	const COLUMN_COUNT = 5;

	let move_maps = $derived({
		google: new Map(moves?.google.map((move) => [move.search, move]) ?? []),
		youtube: new Map(moves?.youtube.map((move) => [move.search, move]) ?? []),
		spotify: new Map(moves?.spotify_episodes.map((move) => [move.search, move]) ?? [])
	});

	function move_text(platform: keyof typeof move_maps, search: string): string {
		const move = move_maps[platform].get(search);
		return move ? format_position_move(move.from, move.to, move.was_tracked) : '';
	}

	function demand_text(row: TrackedRow): string {
		if (!row.demand) return '';
		return [
			`${format_volume(row.demand.search_volume)}/mo`,
			`difficulty ${format_count(row.demand.keyword_difficulty)}`,
			format_volume_trend(row.demand.monthly)
		]
			.filter(Boolean)
			.join(' · ');
	}

	function placement_title(
		name: string,
		position: number | null,
		depth: number,
		page: string | null
	) {
		if (position === null) return `${name}: not in the top ${depth}`;
		return [`${name}: ${format_position(position)}`, page].filter(Boolean).join(' · ');
	}

	function has_history(row: TrackedRow): boolean {
		// A line needs two found positions; a lone dot says nothing about change
		return [row.google_history, row.youtube_history, row.spotify_history].some(
			(history) => history.filter((position) => position !== null).length > 1
		);
	}
</script>

<AdminTable is_empty={groups.length === 0}>
	{#snippet head()}
		<th>Search</th>
		<th><span class="seo-swatch google"></span>Google</th>
		<th><span class="seo-swatch youtube"></span>YouTube</th>
		<th><span class="seo-swatch spotify"></span>Spotify</th>
		<th>Over time</th>
	{/snippet}
	{#each groups as group (group.label)}
		<tr class="seo-group">
			<th colspan={COLUMN_COUNT} scope="colgroup">{group.label}</th>
		</tr>
		{#each group.rows as row (row.search)}
			<tr>
				<td class="admin-cell-title">
					{row.search}
					{#if row.demand}
						<small>{demand_text(row)}</small>
					{/if}
				</td>
				<td data-label="Google">
					<RankChip
						position={row.google.position}
						move={move_text('google', row.search)}
						href={row.google.url}
						title={placement_title(
							'Google',
							row.google.position,
							max_position.google,
							row.google.url ? format_page(row.google.url) : null
						)}
					/>
				</td>
				<td data-label="YouTube">
					<RankChip
						position={row.youtube.position}
						move={move_text('youtube', row.search)}
						href={row.youtube.url}
						title={placement_title(
							'YouTube',
							row.youtube.position,
							max_position.youtube,
							row.youtube.title
						)}
					/>
				</td>
				<td data-label="Spotify">
					{#if row.spotify}
						<RankChip
							position={row.spotify.position}
							move={move_text('spotify', row.search)}
							href={row.spotify.url}
							title={placement_title(
								'Spotify episode',
								row.spotify.position,
								max_position.spotify_episode,
								row.spotify.title
							)}
						/>
						{#if row.spotify_show_position !== null}
							<small class="seo-show">show {format_position(row.spotify_show_position)}</small>
						{/if}
					{/if}
				</td>
				<td>
					{#if has_history(row)}
						<PositionHistory
							google={row.google_history}
							youtube={row.youtube_history}
							spotify={row.spotify_history}
							max={max_position.google}
							label={`${row.search} over the last ${row.google_history.length} snapshots`}
						/>
					{/if}
				</td>
			</tr>
		{/each}
	{/each}
</AdminTable>

<style>
	.seo-group th {
		padding-block-start: var(--pad-medium);
		font-size: var(--fs-2);
		color: var(--admin-muted);
		text-align: start;
	}

	.seo-swatch {
		display: inline-block;
		inline-size: 0.6em;
		block-size: 0.6em;
		margin-inline-end: 0.4em;
		border-radius: 50%;
	}

	.seo-swatch.google {
		background: var(--c-chart-1);
	}

	.seo-swatch.youtube {
		background: var(--c-chart-2);
	}

	.seo-swatch.spotify {
		background: var(--c-chart-3);
	}

	.seo-show {
		display: block;
		font-size: var(--fs-1);
		color: var(--admin-muted);
	}
</style>
