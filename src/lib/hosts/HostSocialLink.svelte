<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import type { Host } from '$server/db/types';
	interface Props {
		host: Host;
	}

	let { host }: Props = $props();

	// if url is not prefixed with https, add it
	const httpHostUrl = host.url && /https?\:/.test(host.url) ? host.url : `https://${host.url}`;
</script>

{#if host.twitter}
	<a href={`https://x.com/${host.twitter}`} target="_blank" class="social-icon">
		<Icon name="twitter" title={`${host.name} on X`} />
	</a>
{/if}

{#if host.github}
	<a href={`https://github.com/${host.github}`} target="_blank" class="social-icon">
		<Icon name="github" title={`${host.name} on GitHub`} />
	</a>
{/if}

{#if host.url}
	<a href={httpHostUrl} target="_blank" class="social-icon">
		<Icon name="monitor" title={`${host.name}'s website'`} />
	</a>
{/if}

<style lang="postcss">
	.social-icon {
		display: inline-block;

		--icon_size: 12px;
	}

	a {
		color: var(--c-fg);

		&:hover {
			color: var(--c-primary);
		}
	}
</style>
