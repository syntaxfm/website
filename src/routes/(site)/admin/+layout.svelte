<nav>
	<a href="/admin/shows">Shows</a>
	<a href="/admin/transcripts">Transcripts</a>
	<a href="/admin/cache">Cache</a>
</nav>

<slot />

<style lang="postcss">
	nav {
		padding: 1rem 0;
		a {
			color: var(--fg);
		}
	}
</style>
