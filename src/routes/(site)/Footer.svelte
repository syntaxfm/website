<script lang="ts">
	import { CURRENT_YEAR } from '$const';
	import Icon from '$lib/Icon.svelte';
	import ProducedBySentry from '$lib/ProducedBySentry.svelte';
</script>

<footer class="layout zone" style:--bg="var(--bg-root)" style:--fg="var(--fg-1)">
	<div>
		<div class="grid">
			<div class="links-col">
				<a href="/shows">Podcast</a>
				<a target="_blank" rel="noopener" href="https://feed.syntax.fm">RSS Feed</a>
				<a href="/about">About</a>
				<a href="/sickpicks">Sick Picks</a>
				<a href="/guests">Guest List</a>

				<a
					target="_blank"
					rel="noopener"
					href="https://sentry.io/welcome/?utm_medium=site&utm_source=syntax&utm_campaign=syntax-sentry-evergreen&utm_content=footer"
					>Sentry.io</a
				>
			</div>
			<div class="links-col">
				<a target="_blank" rel="noopener" href="https://github.com/syntaxfm/website">
					<!-- {process.env.VITE_VERCEL_GIT_COMMIT_SHA
						? process.env.VITE_VERCEL_GIT_COMMIT_SHA.slice(0, 7)
						: ''}  -->
					Source Code
				</a>
				<a href="/system/colors">Colors</a>
				<a href="/system/layout">Layout</a>
				<a href="/system/typography">Typography</a>
				<a href="/system/theme">Theme</a>
				<a href="/pages/privacy">Privacy Policy</a>
				<a href="/pages/terms-of-service">Terms of Service</a>
				<!-- <a href="/system/components">Components</a> -->
			</div>
			<div class="links-col social-links">
				<a target="_blank" rel="noopener" href="https://x.com/syntaxfm"><Icon name="x" /></a>
				<a target="_blank" rel="noopener" href="https://github.com/syntaxfm"
					><Icon name="github" /></a
				>
				<a target="_blank" rel="noopener" href="https://discord.gg/W5y68HMfZV"
					><Icon name="discord" /></a
				>
				<a target="_blank" rel="noopener" href="https://www.youtube.com/@syntaxfm"
					><Icon name="youtube" /></a
				>
				<a target="_blank" rel="noopener" href="https://www.tiktok.com/@syntaxfm"
					><Icon name="tiktok" /></a
				>
				<a target="_blank" rel="noopener" href="https://www.instagram.com/syntax_fm/"
					><Icon name="instagram" /></a
				>
			</div>
		</div>

		<ProducedBySentry />

		<div>
			<p>©️ {CURRENT_YEAR} - Sentry.io</p>
		</div>
	</div>
</footer>

<style lang="postcss">
	footer {
		padding: 2rem 0.5rem 5rem;
		background-image: url('/svg/grit.svg?dark&count=100&w=5000&h=500');
		background-size: 1500px;
		@media (min-width: 1280px) {
			padding: 2rem 0 5rem;
		}
	}

	.links-col {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.social-links {
		flex-direction: row;
		a {
			display: block;
		}
		a:after {
			content: '';
		}
		a:hover {
			color: var(--accent);
		}
	}

	a {
		color: var(--fg);
		&:hover {
			text-decoration: underline;
			text-decoration-color: var(--primary);
		}
	}
</style>
