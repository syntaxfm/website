<script lang="ts">
	import { CURRENT_YEAR } from '$const';
	import Icon from '$lib/Icon.svelte';
	import Logo from '$lib/Logo.svelte';
	import ProducedBySentry from '$lib/ProducedBySentry.svelte';
</script>

<footer class="layout zone" style:--bg="var(--black)" style:--fg="var(--white)">
	<div>
		<div class="grid">
			<div class="links-col">
				<a href="/shows">Podcast</a>
				<a href="/rss">RSS Feed</a>
				<a href="/about">About</a>
				<a href="https://sentry.io">Sentry.io</a>
			</div>
			<div class="links-col">
				<a href="/system/colors">Colors</a>
				<a href="/system/layout">Layout</a>
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
