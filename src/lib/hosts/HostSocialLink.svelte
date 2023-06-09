<script lang="ts">
	export let link: string;
	import twitter from '$assets/twitter.svg';
	import Icon from '$lib/Icon.svelte';
</script>

<a href={link} class="social-icon">
	<Icon name="twitter" />
</a>

<style>
	.social-icon {
		width: 20px;
	}

	a {
		color: var(--sheet-color);
	}
</style>
