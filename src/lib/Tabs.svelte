<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<div class="tabs grit">
	{@render children?.()}
</div>

<style>
	:global {
		.tabs {
			margin-bottom: 1rem;
			display: flex;
			gap: 20px;
			--border-size: 5px;
			border-bottom: var(--border-size) solid var(--primary);

			& > a {
				padding: 10px 1rem;
				border-radius: var(--brad) var(--brad) 0 0;
				font-variation-settings: var(--fw-900);
			}

			a:hover {
				background: var(--bg-1);
			}

			a.active {
				text-decoration: none;
				background: var(--primary);
				position: relative;
				color: var(--dark);
			}
			& :global(a) {
				color: var(--fg);
			}
		}
	}
</style>
