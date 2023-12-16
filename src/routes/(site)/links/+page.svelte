<script lang="ts">
	import Icon from '$/lib/Icon.svelte';
	import NewsletterForm from '$/lib/NewsletterForm.svelte';

	import { PODCAST_LINKS } from '$const';

	let hosts = [
		{
			name: 'Syntax',
			twitter: 'syntaxfm',
			instagram: 'syntax_fm',
			tiktok: 'syntaxfm',
			linkedin_company: 'syntaxfm',
			threads: 'syntax_fm'
		},
		{
			name: 'Wes Bos',
			twitter: 'wesbos',
			github: 'wesbos',
			instagram: 'wesbos',
			tiktok: 'wesbos',
			linkedin: 'wesbos',
			threads: 'wesbos'
		},
		{
			name: 'Scott Tolinski',
			twitter: 'stolinski',
			github: 'stolinski',
			instagram: 'stolinski',
			tiktok: 'stolinski',
			linkedin: 'stolinski',
			threads: 'stolinski'
		}
	];
</script>

<main>
	<div style:margin-bottom="2rem">
		<h2 class="h3">Links</h2>

		<h3 class="h4">Subscribe to the podcast</h3>
		<div>
			{#each PODCAST_LINKS as { text, href }}
				<a
					{href}
					target="_blank"
					class="button subscribe subscribe--{text.toLowerCase().replaceAll(' ', '-')}">{text}</a
				>
			{/each}
		</div>
		<h3 class="h4">Socials</h3>

		{#each hosts as host}
			<div>
				<h4 class="h5">{host.name}</h4>
				{#if host.twitter}
					<a
						href={`https://x.com/${host.twitter}`}
						target="_blank"
						class="button subscribe subscribe--x"
					>
						<Icon name="x" title={`${host.name} on X`} />
						X
					</a>
				{/if}

				{#if host.github}
					<a
						href={`https://github.com/${host.github}`}
						target="_blank"
						class="button subscribe subscribe--github"
					>
						<Icon name="github" title={`${host.name} on GitHub`} />
						GitHub
					</a>
				{/if}

				{#if host.instagram}
					<a
						href={`https://www.instagram.com/${host.instagram}/`}
						target="_blank"
						class="button subscribe subscribe--instagram"
					>
						<Icon name="instagram" title={`${host.name} on Instagram`} />
						Instagram
					</a>
				{/if}

				{#if host.tiktok}
					<a
						href={`https://www.tiktok.com/@${host.tiktok}`}
						target="_blank"
						class="button subscribe subscribe--tiktok"
					>
						<Icon name="tiktok" title={`${host.name} on TikTok`} />
						TikTok
					</a>
				{/if}

				{#if host.linkedin}
					<a
						href={`https://www.linkedin.com/in/${host.linkedin}/`}
						target="_blank"
						class="button subscribe subscribe--linkedin"
					>
						<Icon name="linkedin" title={`${host.name} on LinkedIn`} />
						LinkedIn
					</a>
				{/if}

				{#if host.linkedin_company}
					<a
						href={`https://www.linkedin.com/company/${host.linkedin_company}/`}
						target="_blank"
						class="button subscribe subscribe--linkedin"
					>
						<Icon name="linkedin" title={`${host.name} on LinkedIn`} />
						LinkedIn
					</a>
				{/if}

				{#if host.threads}
					<a
						href={`https://www.threads.net/@${host.threads}`}
						target="_blank"
						class="button subscribe subscribe--threads"
					>
						<Icon name="threads" title={`${host.name} on Threads`} />
						Threads
					</a>
				{/if}
			</div>
		{/each}
	</div>

	<div class="zone layout full" style:--bg="var(--black)" style:--fg="var(--white)">
		<NewsletterForm />
	</div>
</main>

<style lang="postcss">
	div {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.subscribe--apple-podcasts {
		--button-bg: linear-gradient(
			to bottom,
			rgb(205, 102, 246) 0%,
			rgb(154, 61, 209) 80%,
			rgb(142, 52, 201) 100%
		);
	}

	.subscribe::before {
		content: '';
		width: 20px;
		height: 20px;
		display: inline-block;
		background-size: cover;
		border-radius: 5px;
		pointer-events: none;
	}

	.subscribe--apple-podcasts::before {
		background-image: url('/icons/itunes.jpg');
	}

	.subscribe--overcast {
		--button-bg: linear-gradient(to bottom, rgb(255, 138, 10) 0%, rgb(255, 105, 48) 100%);
	}
	.subscribe--overcast::before {
		background-image: url('/icons/overcast.jpg');
	}

	.subscribe--rss {
		--button-bg: linear-gradient(
			to bottom,
			rgb(247, 163, 54) 0%,
			rgb(235, 109, 30) 96%,
			rgb(235, 108, 30) 100%
		);
	}
	.subscribe--rss::before {
		background-image: url('/icons/rss.svg');
	}

	.subscribe--spotify {
		--button-bg: linear-gradient(to bottom, rgb(4, 160, 59) 0%, rgb(16, 172, 71) 100%);
	}
	.subscribe--spotify::before {
		background-image: url('/icons/spotify.svg');
	}
	.subscribe--pocketcasts {
		--button-bg: linear-gradient(to bottom, rgb(242, 43, 36) 0%, rgb(215, 12, 11) 100%);
	}
	.subscribe--pocketcasts::before {
		background-image: url('/icons/pocketcasts.jpg');
	}
	.subscribe--google-podcasts {
		--button-bg: linear-gradient(to bottom, rgb(245, 121, 23) 0%, rgb(254, 185, 90) 100%);
	}
	.subscribe--amazon-music {
		--button-bg: linear-gradient(to bottom, #25d1da 0%, #399a9e 100%);
	}
	.subscribe--google-podcasts::before {
		background-image: url('/icons/google_podcasts.svg');
	}
	.subscribe--amazon-music::before {
		background-image: url('/icons/amznMusic.png');
	}

	.subscribe--github {
		--button-bg: linear-gradient(to bottom, rgb(205, 102, 246) 0%, rgb(110, 84, 148) 100%);
	}

	.subscribe--x {
		--button-bg: linear-gradient(
			to bottom,
			rgb(247, 163, 54) 0%,
			rgb(235, 109, 30) 96%,
			rgb(235, 108, 30) 100%
		);
	}

	.subscribe--tiktok {
		--button-bg: linear-gradient(to bottom, rgba(219, 9, 57, 1) 0%, rgb(254, 44, 85) 100%);
	}

	.subscribe--linkedin {
		--button-bg: linear-gradient(to bottom, rgba(19, 87, 196, 1) 0%, rgb(15, 79, 181) 100%);
	}

	.subscribe--instagram {
		--button-bg: linear-gradient(
			to bottom,
			rgb(247, 163, 54) 0%,
			rgb(235, 109, 30) 96%,
			rgb(235, 108, 30) 100%
		);
	}

	.subscribe--threads {
		--button-bg: linear-gradient(
			to bottom,
			rgb(247, 163, 54) 0%,
			rgb(235, 109, 30) 96%,
			rgb(235, 108, 30) 100%
		);
	}

	a {
		font-size: var(--font-size-lg);
	}
</style>
