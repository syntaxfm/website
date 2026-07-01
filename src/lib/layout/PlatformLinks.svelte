<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { PODCAST_LINKS } from '$const';

	type Platform = {
		/** Matches a `PODCAST_LINKS` entry so the URL stays single-sourced in const.ts. */
		text: string;
		label: string;
		action: string;
		icon?: 'youtube' | 'spotify' | 'apple-podcasts';
		image?: string;
		bg: string;
		fg?: string;
	};

	const PLATFORMS: Platform[] = [
		{
			text: 'Overcast',
			label: 'Overcast',
			action: 'Subscribe',
			image: '/icons/overcast.jpg',
			bg: '#fc7e0f'
		},
		{
			text: 'YouTube',
			label: 'YouTube',
			action: 'Subscribe',
			icon: 'youtube',
			bg: '#f61c0d',
			fg: '#fff'
		},
		{
			text: 'Spotify',
			label: 'Spotify',
			action: 'Follow us',
			icon: 'spotify',
			bg: '#1db954',
			fg: '#000'
		},
		{
			text: 'Apple Podcasts',
			label: 'Apple',
			action: 'Subscribe',
			icon: 'apple-podcasts',
			bg: '#a93dd1',
			fg: '#fff'
		}
	];

	const platforms = PLATFORMS.map((platform) => ({
		...platform,
		href: PODCAST_LINKS.find((link) => link.text === platform.text)?.href ?? '#'
	}));
</script>

<div class="platform-links">
	{#each platforms as { href, label, action, icon, image, bg, fg } (label)}
		<a {href} target="_blank" rel="noopener external" class="platform">
			<span class="badge" style:--badge-bg={bg} style:--badge-fg={fg ?? '#fff'}>
				{#if icon}
					<Icon name={icon} width={24} height={24} />
				{:else if image}
					<img src={image} alt="" />
				{/if}
			</span>
			<span class="labels">
				<span class="name fv-700-i">{label}</span>
				<span class="action">{action}</span>
			</span>
			<Icon name="link-out" width={18} height={18} />
		</a>
	{/each}
</div>

<style lang="postcss">
	.platform-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin: 2rem auto;

		@media (--below-med) {
			flex-direction: column;
			align-items: stretch;
			max-width: 22rem;
		}
	}

	.platform {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 220px;
		padding: 0.75rem 1.25rem;
		color: var(--c-fg);
		background: var(--c-bg);
		border: var(--b-medium);
		border-radius: var(--br-large);
		box-shadow: var(--s-graphic);
		text-decoration: none;
		transition: transform 0.1s ease;

		@media (--below-med) {
			min-width: 0;
		}
	}

	.platform:hover {
		transform: translate(2px, -2px);
	}

	/* The card uses an explicit link-out icon, so suppress the global external-link ↗. */
	.platform::after {
		content: none;
	}

	.badge {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--badge-bg);
		color: var(--badge-fg);
		overflow: hidden;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.labels {
		display: flex;
		flex-direction: column;
		margin-right: auto;
	}

	.name {
		font-size: var(--fs-5);
		line-height: 1.1;
	}

	.action {
		font-size: var(--fs-1);
	}
</style>
