<script lang="ts">
	import Icon from '$/lib/Icon.svelte';
	import NewsletterForm from '$/lib/NewsletterForm.svelte';
	import PodcastLinks from '$/lib/PodcastLinks.svelte';
	import Schedule from '$/lib/schedule.svelte';

	const POD_DATA = {
		name: 'Syntax',
		twitter: 'syntaxfm',
		instagram: 'syntax_fm',
		tiktok: 'syntaxfm',
		linkedin_company: 'syntaxfm',
		threads: 'syntax_fm'
	};
</script>

<section
	aria-label="Podcast Information Section"
	style:--bg="var(--black)"
	style:--fg="var(--white)"
	class="zone full layout"
	style="margin-bottom: 2rem;"
>
	<h3 class="lines" style="margin: 2rem 0;">Subscribe to the podcast</h3>
	<PodcastLinks />
	<div style="margin-bottom: 2rem;" />
	<Schedule />
</section>

<section style="margin-top: 5rem;">
	<h3 class="h3 lines">Links</h3>

	<div class="links">
		<a
			href={`https://x.com/${POD_DATA.twitter}`}
			target="_blank"
			class="button subscribe subscribe--x"
		>
			<Icon name="x" title={`${POD_DATA.name} on X`} />
			X
		</a>

		<a
			href={`https://github.com/${POD_DATA.github}`}
			target="_blank"
			class="button subscribe subscribe--github"
		>
			<Icon name="github" title={`${POD_DATA.name} on GitHub`} />
			GitHub
		</a>

		<a
			href={`https://www.instagram.com/${POD_DATA.instagram}/`}
			target="_blank"
			class="button subscribe subscribe--instagram"
		>
			<Icon name="instagram" title={`${POD_DATA.name} on Instagram`} />
			Instagram
		</a>

		<a
			href={`https://www.tiktok.com/@${POD_DATA.tiktok}`}
			target="_blank"
			class="button subscribe subscribe--tiktok"
		>
			<Icon name="tiktok" title={`${POD_DATA.name} on TikTok`} />
			TikTok
		</a>

		<a
			href={`https://www.linkedin.com/company/${POD_DATA.linkedin_company}/`}
			target="_blank"
			class="button subscribe subscribe--linkedin"
		>
			<Icon name="linkedin" title={`${POD_DATA.name} on LinkedIn`} />
			LinkedIn
		</a>

		<a
			href={`https://www.threads.net/@${POD_DATA.threads}`}
			target="_blank"
			class="button subscribe subscribe--threads"
		>
			<Icon name="threads" title={`${POD_DATA.name} on Threads`} />
			Threads
		</a>
	</div>
</section>

<div class="zone layout full" style:--bg="var(--black)" style:--fg="var(--white)">
	<div>
		<NewsletterForm />
	</div>
</div>

<style lang="postcss">
	.links {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 20px 0;
	}
	.subscribe--github {
		--button-fg: #fff;
		--button-bg: linear-gradient(to bottom, rgb(50, 50, 50) 0%, rgb(0, 0, 0) 96%);
	}

	.subscribe--x {
		--button-fg: #fff;
		--button-bg: linear-gradient(to bottom, rgb(50, 50, 50) 0%, rgb(0, 0, 0) 96%);
	}

	.subscribe--tiktok {
		--button-fg: #fff;
		--button-bg: linear-gradient(to bottom, rgb(50, 50, 50) 0%, rgb(0, 0, 0) 96%);
	}

	.subscribe--linkedin {
		--button-fg: #fff;
		--button-bg: linear-gradient(to bottom, rgba(19, 87, 196, 1) 0%, rgb(15, 79, 181) 100%);
	}

	.subscribe--instagram {
		--button-bg: linear-gradient(to bottom, #e9358d 0%, #f5c543 96%);
	}

	.subscribe--threads {
		--button-fg: #fff;
		--button-bg: linear-gradient(to bottom, rgb(50, 50, 50) 0%, rgb(0, 0, 0) 96%);
	}

	a {
		font-size: var(--font-size-lg);
	}
</style>
