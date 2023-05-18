<script lang="ts">
	import { theme_maker } from '$state/theme';
</script>

<button on:click={theme_maker.open}>🎨</button>

<style>
	button {
		background: transparent;
		border: var(--yellow) solid 1px;
	}
</style>
