<script lang="ts">
	import Icon from '../Icon.svelte';
</script>

<section>
	<div class="flex">
		<ul>
			<li><a href="/shows">Podcast</a></li>
			<li><a target="_blank" rel="noopener" href="https://feed.syntax.fm">RSS Feed</a></li>
			<li><a href="/about">About</a></li>
			<li><a href="/sickpicks">Sick Picks</a></li>
			<li><a href="/guests">Guest List</a></li>
			<li>
				<a
					target="_blank"
					rel="noopener"
					href="https://sentry.io/welcome/?utm_medium=site&utm_source=syntax&utm_campaign=syntax-sentry-evergreen&utm_content=footer"
					>Sentry.io</a
				>
			</li>
		</ul>
		<ul>
			<li>
				<a target="_blank" rel="noopener" href="https://github.com/syntaxfm/website">
					<!-- {process.env.VITE_VERCEL_GIT_COMMIT_SHA
						? process.env.VITE_VERCEL_GIT_COMMIT_SHA.slice(0, 7)
						: ''}  -->
					Source Code
				</a>
			</li>
			<li><a href="/system/colors">Colors</a></li>
			<li><a href="/system/layout">Layout</a></li>
			<li><a href="/system/typography">Typography</a></li>
			<li><a href="/system/theme">Theme</a></li>
			<li><a href="/pages/privacy">Privacy Policy</a></li>
			<li><a href="/pages/terms-of-service">Terms of Service</a></li>
			<!-- <a href="/system/components">Components</a> -->
		</ul>
	</div>
	<div class="social-links">
		<a target="_blank" rel="noopener" href="https://x.com/syntaxfm"
			><Icon name="twitter" width={24} height={24} /></a
		>
		<a target="_blank" rel="noopener" href="https://github.com/syntaxfm"
			><Icon name="github" width={24} height={24} /></a
		>
		<a target="_blank" rel="noopener" href="https://discord.gg/W5y68HMfZV"
			><Icon name="discord" width={24} height={24} /></a
		>
		<a target="_blank" rel="noopener" href="https://www.youtube.com/@syntaxfm"
			><Icon name="youtube" width={24} height={24} /></a
		>
		<a target="_blank" rel="noopener" href="https://www.tiktok.com/@syntaxfm"
			><Icon name="tiktok" width={24} height={24} /></a
		>
		<a target="_blank" rel="noopener" href="https://www.instagram.com/syntax_fm/"
			><Icon name="instagram" width={24} height={24} /></a
		>
	</div>
</section>

<style>
	section {
		font-size: var(--fs-2);

		ul {
			width: 50%;
		}

		ul,
		li {
			list-style: none;
			padding: 0;
		}

		li {
			margin-bottom: 0.5rem;
		}

		a {
			color: var(--c-fg);
			text-decoration: none;
		}

		@media (width < 700px) {
			.flex {
				flex-direction: column;
			}
		}
	}

	.social-links {
		display: flex;
		gap: 20px;
		margin-top: 1.25rem;

		a::after {
			display: none;
		}
	}
</style>
