<script lang="ts">
	import Icon, { type IconName, icon_names } from '$lib/Icon.svelte';
	import IconSprite from '$lib/utilities/IconSprite.svelte';
</script>

<div class="icons-grid">
	{#each icon_names as icon_name}
		<div class="icon-box">
			<Icon name={icon_name} />
			<span class="icon-name">{icon_name}</span>
		</div>
	{/each}
</div>

<IconSprite />

<style>
	.icons-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		padding: 1rem;
	}

	.icon-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid var(--c-fg);
		border-radius: 0.5rem;
	}

	.icon-name {
		font-size: var(--fs-2);
		color: var(--c-fg);
		text-align: center;
	}
</style>
