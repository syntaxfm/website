<script lang="ts">
	import Icon from '#lib/Icon.svelte';
	import { FEATURED_PODCAST_PLATFORMS, type Platform } from '#lib/social/platforms.ts';

	const {
		platforms = FEATURED_PODCAST_PLATFORMS,
		is_stacked = false
	}: { platforms?: Platform[]; is_stacked?: boolean } = $props();
</script>

<div class="platform-links" class:stacked={is_stacked}>
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

		/* One card per row at every width, filling whatever column it's placed in */
		&.stacked {
			flex-direction: column;
			align-items: stretch;
			max-width: none;
			margin: 0;
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
		background: var(--badge-bg, transparent);
		color: var(--badge-fg, var(--c-white));
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
