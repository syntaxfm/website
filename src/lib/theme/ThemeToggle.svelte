<script lang="ts">
	import { theme_maker } from '$state/theme';
</script>

<button onclick={theme_maker.open}>🎨</button>

<style lang="postcss">
	button {
		background: transparent;
		border: var(--yellow) solid 1px;
	}
</style>
