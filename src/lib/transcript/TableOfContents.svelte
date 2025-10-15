<script lang="ts">
	import type { AINoteWithFriends } from '$server/ai/queries';
	import slug from 'speakingurl';

	interface Props {
		aiShowNote: AINoteWithFriends;
	}

	let { aiShowNote }: Props = $props();
</script>

<div>
	<ul>
		{#each aiShowNote?.summary || [] as summary}
			<li>
				<a href="#{slug(summary.text)}">
					<span class="timestamp fv-900">{summary.time}</span>
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

		--border-color: var(--c-black-1);

		border: 1px solid var(--border-color);
		border-radius: 10px;
		display: grid;

		--min: 400px;

		grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));

		@media (--below-med) {
			--min: 200px;
		}
	}

	li {
		line-height: initial;
		list-style: none;
		padding: 10px;
		border-bottom: 1px solid var(--border-color);
		font-size: var(--fs-3);

		&:nth-child(odd) {
			border-right: 1px solid var(--border-color);
		}

		&:last-child,
		&:nth-last-child(2) {
			border-bottom: none;
		}
	}

	a {
		font-size: var(--fs-3);
		text-decoration: none;
	}

	.timestamp {
		display: inline;
		font-size: var(--fs-2);
		color: var(--c-black-1);
	}
</style>
