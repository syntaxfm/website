<script lang="ts">
	import { CURRENT_YEAR } from '$const';
</script>

<footer class="main-layout">
	<div class="place-content">
		<div class="links-col">
			<a href="/shows">Podcast</a>
			<a href="/rss">RSS Feed</a>
			<a href="https://sentry.io">Sentry.io</a>
		</div>
		<div>
			<p>
				Nearly 4M developers and 90K organizations rely on Sentry to see what actually matters,
				solve what's urgent faster, and learn continuously about their code.
			</p>
			<a href="https://sentry.io/signup/?original_referrer=https://syntax.fm/" class="button ghost"
				>Try Sentry for Free</a
			>
		</div>

		<div>
			<p>©️ {CURRENT_YEAR} - Sentry.io</p>
		</div>
	</div>
</footer>

<style>
	footer {
		background: var(--black);
		color: var(--color);
		padding: 5rem 0.5rem 5rem;

		@media (min-width: 1280px) {
			padding: 5rem 0 5rem;
		}
	}

	.links-col {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	a {
		color: var(--color);
	}
</style>
