<script lang="ts">
	import Icon from '../Icon.svelte';
</script>

<button>
	<Icon width={19.5} height={19.5} name="search" />
</button>

<style>
	button {
		--size: 40px;

		color: var(--c-fg);
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--c-tint-or-shade);
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		&:hover {
			background: var(--c-tint-or-shade-hard);
		}
	}
</style>
