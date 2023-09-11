<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	export let host: {
		name: string;
		github: string;
		twitter: string;
		slug?: string;
	};
</script>

<a href={`https://x.com/${host.twitter}`} target="_blank" class="social-icon">
	<Icon name="x" title={`${host.name} on X`} />
</a>
<a href={`https://github.com/${host.github}`} target="_blank" class="social-icon">
	<Icon name="github" title={`${host.name} on GitHub`} />
</a>

<style lang="postcss">
	.social-icon {
		width: 20px;
	}

	a {
		color: var(--fg);
		&:hover {
			color: var(--accent);
		}
	}
</style>
