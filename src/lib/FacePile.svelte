<script lang="ts">
	type FaceForThePile = {
		name: string;
		github: string;
	};
	interface Props {
		size?: string;
		faces?: FaceForThePile[];
	}

	let { size = '50px', faces = [] }: Props = $props();
</script>

<div class="pile" style:--face-size={size} style:--face-count={faces.length}>
	{#each faces as face}
		<img src="https://github.com/{face.github || 'null'}.png" alt={face.name} />
	{/each}
</div>

<style lang="postcss">
	.pile {
		--local-size: var(--face-size, 50px);
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: calc(var(--local-size) / 1.5);
		gap: 0;
		transition: all 0.2s;
	}
	.pile:hover {
		z-index: 2;
		&:has(img:nth-child(n + 4)) {
			gap: calc(var(--local-size) / 8);
		}
		gap: calc(var(--local-size) / 4);
	}
	img {
		width: var(--local-size);
		height: var(--local-size);
		aspect-ratio: 1 / 1;
		background: var(--fg);
		color: var(--bg);
		font-size: var(--local-size);
		border-radius: 50%;
		overflow: hidden;
		border: 1.5px solid var(--bg);
	}
</style>
