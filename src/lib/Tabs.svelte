<div class="tabs grit">
	<slot />
</div>

<style>
	:global {
		.tabs {
			margin-bottom: 1rem;
			display: flex;
			gap: 20px;
			/* background: var(--bg-1); */
			--border-size: 5px;
			border-bottom: var(--border-size) solid var(--primary);
			/* padding: 10px 10px 0 10px; */
			& > a {
				padding: 10px 1rem;
				border-radius: var(--brad) var(--brad) 0 0;
				font-weight: 900;
			}
			a:hover {
				background: var(--bg-1);
			}
			a.active {
				text-decoration: none;
				background: var(--primary);
				position: relative;
			}
			& :global(a) {
				color: var(--fg);
			}
		}
	}
</style>
