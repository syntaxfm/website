<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	interface Props {
		host: {
		name: string;
		github?: string | null;
		twitter?: string | null;
		url?: string | null;
		slug?: string;
	};
	}

	let { host }: Props = $props();

	// if url is not prefixed with https, add it
	const httpHostUrl = host.url && /https?\:/.test(host.url) ? host.url : `https://${host.url}`;
</script>

{#if host.twitter}
	<a href={`https://x.com/${host.twitter}`} target="_blank" class="social-icon">
		<Icon name="x" title={`${host.name} on X`} />
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
		color: var(--fg);
		&:hover {
			color: var(--accent);
		}
	}
</style>
