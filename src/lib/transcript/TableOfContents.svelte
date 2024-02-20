<script lang="ts">
	import type { AINoteWithFriends } from '$server/ai/queries';
	import slug from 'speakingurl';

	export let aiShowNote: AINoteWithFriends;
</script>

<div class="toc">
	<ul>
		{#each aiShowNote?.summary || [] as summary}
			<li>
				<a href="#{slug(summary.text)}">
					<span class="timestamp">{summary.time}</span>
					{summary.text}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style lang="postcss">
	ul {
		margin: 0;
		padding: 0;
		--border-color: var(--subtle);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		display: grid;
		--min: 400px;
		grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
		@media (--below_med) {
			--min: 200px;
		}
	}
	li {
		padding: 0;
		line-height: initial;
		list-style: none;
		padding: 10px;
		border-bottom: 1px solid var(--border-color);
		font-size: var(--font-size-sm);
		&:nth-child(odd) {
			border-right: 1px solid var(--border-color);
		}
		&:last-child,
		&:nth-last-child(2) {
			border-bottom: none;
		}
	}
	a {
		font-size: var(--font-size-s);
		text-decoration: none;
	}
	.timestamp {
		display: inline;
		font-size: var(--font-size-xs);
		color: var(--subtle-accent);
		font-weight: 900;
	}
</style>
