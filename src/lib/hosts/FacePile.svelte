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
	{#each faces as face, index (index)}
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

		/* Each face covers a third of the one before. A margin, so the pile is as wide as it looks. */
		& + span {
			margin-left: calc(var(--local-size) / -3);
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

		/* Grows with the face: 2px on the feed's small faces, 4px on a share image's large ones */
		border: var(--b-medium);
		border-width: max(2px, calc(var(--local-size) / 30));
	}
</style>
