<script lang="ts">
	import { onMount } from 'svelte';
	import { format } from 'date-fns';

	interface RelatedEpisode {
		number: number;
		title: string;
		slug: string;
		date: string;
		show_type: string;
		similarity: number;
		guests: Array<{ name: string; of?: string }>;
		topics: string[];
		url: string;
	}

	interface RelatedEpisodesResponse {
		show_number: number;
		related_episodes: RelatedEpisode[];
		total: number;
		message?: string;
	}

	export let show_number: number;
	export let limit: number = 5;
	export let threshold: number = 0.7;

	let related_episodes: RelatedEpisode[] = [];
	let loading = true;
	let error_message = '';

	async function fetchRelatedEpisodes() {
		try {
			loading = true;
			error_message = '';

			const response = await fetch(
				`/api/shows/${show_number}/related?limit=${limit}&threshold=${threshold}`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch related episodes: ${response.statusText}`);
			}

			const data: RelatedEpisodesResponse = await response.json();
			related_episodes = data.related_episodes;

			if (data.message) {
				error_message = data.message;
			}
		} catch (err) {
			console.error('Error fetching related episodes:', err);
			error_message = 'Failed to load related episodes';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchRelatedEpisodes();
	});

	function formatEpisodeType(type: string): string {
		switch (type.toLowerCase()) {
			case 'hasty':
				return 'Hasty Treat';
			case 'tasty':
				return 'Tasty Treat';
			case 'supper':
				return 'Supper Club';
			default:
				return type;
		}
	}

	function formatSimilarity(similarity: number): string {
		return `${Math.round(similarity * 100)}% similar`;
	}
</script>

<div class="related-episodes">
	<h3>Related Episodes</h3>

	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Finding related episodes...</p>
		</div>
	{:else if error_message}
		<div class="error">
			<p>{error_message}</p>
		</div>
	{:else if related_episodes.length === 0}
		<div class="no-results">
			<p>No related episodes found. This might be because:</p>
			<ul>
				<li>This episode hasn't been processed for similarity yet</li>
				<li>No other episodes are similar enough (try lowering the threshold)</li>
			</ul>
		</div>
	{:else}
		<div class="episodes-list">
			{#each related_episodes as episode}
				<article class="episode-card">
					<div class="episode-header">
						<div class="episode-number">#{episode.number}</div>
						<div class="episode-type">{formatEpisodeType(episode.show_type)}</div>
						<div class="similarity">{formatSimilarity(episode.similarity)}</div>
					</div>

					<h4 class="episode-title">
						<a href={episode.url}>{episode.title}</a>
					</h4>

					<div class="episode-meta">
						<time>{format(new Date(episode.date), 'MMM d, yyyy')}</time>

						{#if episode.guests.length > 0}
							<div class="guests">
								with {episode.guests.map(g => `${g.name}${g.of ? ` (${g.of})` : ''}`).join(', ')}
							</div>
						{/if}
					</div>

					{#if episode.topics.length > 0}
						<div class="topics">
							{#each episode.topics.slice(0, 3) as topic}
								<span class="topic-tag">{topic}</span>
							{/each}
							{#if episode.topics.length > 3}
								<span class="topic-more">+{episode.topics.length - 3} more</span>
							{/if}
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.related-episodes {
		margin: 2rem 0;
		padding: 1.5rem;
		background: var(--bg-2);
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	h3 {
		margin: 0 0 1.5rem 0;
		color: var(--fg);
		font-size: 1.5rem;
		font-weight: 600;
	}

	.loading {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
		color: var(--fg-2);
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--border);
		border-top: 2px solid var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error {
		padding: 1rem;
		background: var(--red-1);
		border: 1px solid var(--red-6);
		border-radius: 4px;
		color: var(--red-11);
	}

	.no-results {
		padding: 1rem;
		color: var(--fg-2);
	}

	.no-results ul {
		margin: 0.5rem 0 0 1rem;
		padding: 0;
	}

	.episodes-list {
		display: grid;
		gap: 1rem;
	}

	.episode-card {
		padding: 1rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		transition: border-color 0.2s ease;
	}

	.episode-card:hover {
		border-color: var(--accent);
	}

	.episode-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.episode-number {
		font-weight: 600;
		color: var(--accent);
	}

	.episode-type {
		padding: 0.125rem 0.5rem;
		background: var(--accent-3);
		color: var(--accent-11);
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.similarity {
		margin-left: auto;
		color: var(--fg-2);
		font-size: 0.75rem;
	}

	.episode-title {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		line-height: 1.4;
	}

	.episode-title a {
		color: var(--fg);
		text-decoration: none;
	}

	.episode-title a:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.episode-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		color: var(--fg-2);
	}

	.guests {
		font-style: italic;
	}

	.topics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.topic-tag {
		padding: 0.125rem 0.5rem;
		background: var(--bg-3);
		color: var(--fg-2);
		border-radius: 12px;
		font-size: 0.75rem;
	}

	.topic-more {
		color: var(--fg-3);
		font-size: 0.75rem;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.related-episodes {
			margin: 1rem 0;
			padding: 1rem;
		}

		.episode-header {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.similarity {
			margin-left: 0;
			order: -1;
			width: 100%;
		}
	}
</style>