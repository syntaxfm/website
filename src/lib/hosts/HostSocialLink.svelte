<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	export let host: {
		name: string;
		github?: string | null;
		twitter?: string | null;
		slug?: string;
	};
</script>

<a href={`https://x.com/${host.twitter}`} target="_blank" rel="noopener" class="social-icon">
	<Icon name="x" title={`${host.name} on X`} />
</a>

<a href={`https://github.com/${host.github}`} target="_blank" rel="noopener" class="social-icon">
	<Icon name="github" title={`${host.name} on GitHub`} />
</a>

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
