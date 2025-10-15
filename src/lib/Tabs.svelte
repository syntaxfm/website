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

			border-bottom: var(--border-size) solid var(--c-primary);

			& > a {
				padding: 10px 1rem;
				border-radius: var(--br-medium) var(--br-medium) 0 0;
				font-variation-settings: var(--fv-900);
			}

			a:hover {
				background: var(--c-bg);
			}

			a.active {
				text-decoration: none;
				background: var(--c-primary);
				position: relative;
				color: var(--c-black);
			}

			& :global(a) {
				color: var(--c-fg);
			}
		}
	}
</style>
