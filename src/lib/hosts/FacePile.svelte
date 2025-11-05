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
		<span>
			<img src="https://github.com/{face.github || 'null'}.png" alt={face.name} />
		</span>
	{/each}
</div>

<style>
	.pile {
		--local-size: var(--face-size, 50px);
		display: flex;
	}

	span {
		flex-shrink: 0;
		&:nth-child(2) {
			translate: calc((var(--local-size) / 3) * -1) 0;
		}
		&:nth-child(3) {
			translate: calc((var(--local-size) / 3 * -2)) 0;
		}
	}

	img {
		width: var(--local-size);
		height: var(--local-size);
		aspect-ratio: 1 / 1;
		background: var(--c-fg);
		color: var(--c-bg);
		font-size: var(--local-size);
		border-radius: 50%;
		overflow: hidden;
		border: var(--b-medium);
	}
</style>
