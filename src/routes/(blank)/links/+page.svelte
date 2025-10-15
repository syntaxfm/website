<script lang="ts">
	import Icon from '$/lib/Icon.svelte';
	import Logo from '$/lib/layout/Logo.svelte';
	import NewsletterForm from '$/lib/newsletter/NewsletterForm.svelte';
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

<div>
	<div class="logo">
		<a href="/"><Logo /></a>
	</div>
	<main class="layout zone" style:--c-bg="var(--c-bg)" style:--c-fg="var(--c-fg)">
		<section>
			<h3 class="h4" style="margin: 2rem 0;">Subscribe to the podcast</h3>
			<PodcastLinks />
			<br />
			<h3 class="h4">Links</h3>

			<div class="links">
				<a href={`https://x.com/${POD_DATA.twitter}`} target="_blank" class="button subscribe">
					<Icon name="x" title={`${POD_DATA.name} on X`} />
				</a>

				<a href={`https://github.com/${POD_DATA.github}`} target="_blank" class="button subscribe">
					<Icon name="github" title={`${POD_DATA.name} on GitHub`} />
				</a>

				<a
					href={`https://www.instagram.com/${POD_DATA.instagram}/`}
					target="_blank"
					class="button subscribe"
				>
					<Icon name="instagram" title={`${POD_DATA.name} on Instagram`} />
				</a>

				<a
					href={`https://www.tiktok.com/@${POD_DATA.tiktok}`}
					target="_blank"
					class="button subscribe"
				>
					<Icon name="tiktok" title={`${POD_DATA.name} on TikTok`} />
				</a>

				<a
					href={`https://www.linkedin.com/company/${POD_DATA.linkedin_company}/`}
					target="_blank"
					class="button subscribe"
				>
					<Icon name="linkedin" title={`${POD_DATA.name} on LinkedIn`} />
				</a>

				<a
					href={`https://www.threads.net/@${POD_DATA.threads}`}
					target="_blank"
					class="button subscribe"
				>
					<Icon name="threads" title={`${POD_DATA.name} on Threads`} />
				</a>
			</div>
		</section>

		<div class="zone layout full" style:--c-bg="var(--c-black)" style:--c-fg="var(--c-white)">
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
		--button-bg: linear-gradient(to bottom, rgb(255 255 255) 0%, rgb(200 200 200) 96%);
	}

	a {
		font-size: var(--fs-4);
		font-variation-settings: var(--fv-400);
	}
</style>
