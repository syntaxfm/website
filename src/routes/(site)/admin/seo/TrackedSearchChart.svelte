<script lang="ts">
	import type { GoogleSearchCheck, YoutubeSearchCheck } from '$server/seo_tracker/seo_report';
	import { position_percent } from './seo_charts';
	import { format_position } from './seo_format';

	// Each tracked search's position on Google and on YouTube, #1 on the left. Searches where
	// Syntax isn't in the results get a hollow marker in the last column.

	let {
		google,
		youtube,
		max_position
	}: { google: GoogleSearchCheck[]; youtube: YoutubeSearchCheck[]; max_position: number } =
		$props();

	const TICKS = [1, 3, 10, 20];

	type Platform = { key: 'google' | 'youtube'; name: string; position: number | null };

	let rows = $derived.by(() => {
		const youtube_by_search = new Map(youtube.map((check) => [check.search, check]));
		const searches = [
			...new Set([...google.map((check) => check.search), ...youtube.map((check) => check.search)])
		];
		const google_by_search = new Map(google.map((check) => [check.search, check]));
		return searches.map((search) => {
			const platforms: Platform[] = [
				{
					key: 'google',
					name: 'Google',
					position: google_by_search.get(search)?.syntax_position ?? null
				},
				{
					key: 'youtube',
					name: 'YouTube',
					position: youtube_by_search.get(search)?.syntax_position ?? null
				}
			];
			const summary = platforms
				.map(
					(platform) =>
						`${platform.name} ${platform.position === null ? 'not found' : format_position(platform.position)}`
				)
				.join(', ');
			return { search, platforms, summary };
		});
	});

	function marker_title(platform: Platform): string {
		return platform.position === null
			? `${platform.name}: not in the top ${max_position}`
			: `${platform.name}: ${format_position(platform.position)}`;
	}
</script>

<div class="tracked-chart">
	<ul class="tracked-legend">
		<li><span class="marker google"></span>Google</li>
		<li><span class="marker youtube"></span>YouTube</li>
		<li><span class="marker google missing"></span>Not found</li>
	</ul>

	<div class="tracked-row tracked-axis" aria-hidden="true">
		<span></span>
		<span class="tracked-track">
			{#each TICKS as tick (tick)}
				<span class="tick-label" style:inset-inline-start="{position_percent(tick, max_position)}%"
					>#{tick}</span
				>
			{/each}
		</span>
		<span></span>
	</div>

	<ul class="tracked-rows">
		{#each rows as row (row.search)}
			<li class="tracked-row" aria-label={`${row.search}: ${row.summary}`}>
				<span class="tracked-search">{row.search}</span>
				<span class="tracked-track" aria-hidden="true">
					{#each TICKS as tick (tick)}
						<span class="tick" style:inset-inline-start="{position_percent(tick, max_position)}%"
						></span>
					{/each}
					{#each row.platforms as platform (platform.key)}
						{#if platform.position !== null}
							<span
								class="marker-hit {platform.key}"
								style:inset-inline-start="{position_percent(platform.position, max_position)}%"
								title={marker_title(platform)}
							>
								<span class="marker {platform.key}"></span>
							</span>
						{/if}
					{/each}
				</span>
				<span class="tracked-missing" aria-hidden="true">
					{#each row.platforms as platform (platform.key)}
						{#if platform.position === null}
							<span class="marker {platform.key} missing" title={marker_title(platform)}></span>
						{/if}
					{/each}
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
		grid-template-columns: minmax(8rem, 14rem) minmax(0, 1fr) 3rem;
		align-items: center;
		gap: var(--pad-small);
		min-block-size: 32px;
		font-size: var(--fs-2);
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

	.marker {
		display: inline-block;
		flex: none;
		inline-size: 10px;
		block-size: 10px;
		box-shadow: 0 0 0 2px var(--c-bg);
	}

	/* Shape tells the two apart without color: Google round, YouTube square */
	.marker.google {
		background: var(--c-chart-1);
		border-radius: 50%;
	}

	.marker.youtube {
		background: var(--c-chart-2);
		border-radius: 2px;
	}

	.marker.missing {
		background: transparent;
		border: 2px solid var(--c-chart-1);
	}

	.marker.youtube.missing {
		border-color: var(--c-chart-2);
	}

	.tracked-missing {
		display: flex;
		gap: var(--pad-xsmall);
	}

	@container (width < 32rem) {
		.tracked-row {
			grid-template-columns: minmax(0, 1fr) 3rem;
		}

		.tracked-search {
			grid-column: 1 / -1;
			padding-block-start: var(--pad-xsmall);
		}

		.tracked-axis > span:first-child {
			display: none;
		}
	}
</style>
