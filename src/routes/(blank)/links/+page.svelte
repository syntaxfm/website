<script lang="ts">
	import Icon from '$/lib/Icon.svelte';
	import Logo from '$/lib/Logo.svelte';
	import NewsletterForm from '$/lib/NewsletterForm.svelte';
	import PodcastLinks from '$/lib/PodcastLinks.svelte';
	import '../../(site)/style.css';

	const POD_DATA = {
		name: 'Syntax',
		twitter: 'syntaxfm',
		instagram: 'syntax_fm',
		tiktok: 'syntaxfm',
		linkedin_company: 'syntaxfm',
		threads: 'syntax_fm',
		github: 'syntaxfm'
	} as const;
</script>

<div class="theme-wrapper theme-light">
	<div class="logo">
		<a href="/"><Logo /></a>
	</div>
	<main class="page-layout layout zone" style:--bg="var(--bg-sheet)" style:--fg="var(--fg-sheet)">
		<section>
			<h3 class="h4 lines" style="margin: 2rem 0;">Subscribe to the podcast</h3>
			<PodcastLinks />
			<br />
			<h3 class="h4 lines">Links</h3>

			<div class="links">
				<a
					href={`https://x.com/${POD_DATA.twitter}`}
					target="_blank"
					class="button subscribe subscribe--x"
				>
					<Icon name="x" title={`${POD_DATA.name} on X`} />
				</a>

				<a
					href={`https://github.com/${POD_DATA.github}`}
					target="_blank"
					class="button subscribe subscribe--github"
				>
					<Icon name="github" title={`${POD_DATA.name} on GitHub`} />
				</a>

				<a
					href={`https://www.instagram.com/${POD_DATA.instagram}/`}
					target="_blank"
					class="button subscribe subscribe--instagram"
				>
					<Icon name="instagram" title={`${POD_DATA.name} on Instagram`} />
				</a>

				<a
					href={`https://www.tiktok.com/@${POD_DATA.tiktok}`}
					target="_blank"
					class="button subscribe subscribe--tiktok"
				>
					<Icon name="tiktok" title={`${POD_DATA.name} on TikTok`} />
				</a>

				<a
					href={`https://www.linkedin.com/company/${POD_DATA.linkedin_company}/`}
					target="_blank"
					class="button subscribe subscribe--linkedin"
				>
					<Icon name="linkedin" title={`${POD_DATA.name} on LinkedIn`} />
				</a>

				<a
					href={`https://www.threads.net/@${POD_DATA.threads}`}
					target="_blank"
					class="button subscribe subscribe--threads"
				>
					<Icon name="threads" title={`${POD_DATA.name} on Threads`} />
				</a>
			</div>
		</section>

		<div class="zone layout full" style:--bg="var(--black)" style:--fg="var(--white)">
			<div>
				<NewsletterForm show_logo={false} />
			</div>
		</div>
	</main>
</div>

<style lang="postcss">
	.logo {
		margin: 0 auto;
		width: 50%;
		max-width: 100px;
	}
	.links {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px 0;
	}

	.subscribe {
		--button-fg: #000;
		--button-bg: linear-gradient(to bottom, rgb(255, 255, 255) 0%, rgb(200, 200, 200) 96%);
	}

	a {
		font-size: var(--font-size-md);
		font-weight: 400;
	}
</style>
