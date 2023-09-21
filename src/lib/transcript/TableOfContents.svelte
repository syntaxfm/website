<script lang="ts">
	import { AINoteWithFriends } from '$server/ai/queries';
	import slugify from '@sindresorhus/slugify';

	export let aiShowNote: AINoteWithFriends;
</script>

<div class="toc">
	<ul>
		{#each aiShowNote?.summary || [] as summary}
			<li>
				<a href="#{slugify(summary.text)}">
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
		border: 1px solid var(--purple);
		border-radius: 10px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
	}
	li {
		padding: 0;
		line-height: initial;
		list-style: none;
		padding: 10px;
		border-bottom: 1px solid var(--purple);
		&:nth-child(odd) {
			border-right: 1px solid var(--purple);
		}
		&:last-child {
			border-bottom: none;
		}
	}
	a {
		font-size: var(--font-size-s);
		text-decoration: none;
	}
	.timestamp {
		display: block;
		font-size: var(--font-size-xs);
		color: var(--purple);
	}
</style>
