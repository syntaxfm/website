<script lang="ts">
	type FaceForThePile = {
		name: string;
		github: string;
	};
	export let size = '50px';
	export let faces: FaceForThePile[] = [];
</script>

<div class="pile" style:--face-size={size}>
	{#each faces as face}
		<img src="https://github.com/{face.github || 'null'}.png" alt={face.name} />
	{/each}
</div>

<style lang="postcss">
	.pile {
		--local-size: var(--face-size, 50px);
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: calc(var(--local-size) / 1.2);
		gap: 0;
		transition: all 0.2s;
	}
	.pile:hover {
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
