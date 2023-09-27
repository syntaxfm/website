<script lang="ts">
	type FaceForThePile = {
		name: string;
		github: string;
	};
	export let faces: FaceForThePile[] = [];
</script>

<div class="pile">
	{#each faces as face}
		<img src="https://github.com/{face.github}.png" alt={face.name} />
	{/each}
</div>

<style lang="postcss">
	.pile {
		--size: 50px;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: calc(var(--size) / 1.5);
		gap: 0;
		transition: all 0.2s;
	}
	.pile:hover {
		gap: calc(var(--size) / 2);
	}
	img {
		width: var(--size);
		height: var(--size);
		aspect-ratio: 1 / 1;
		background: var(--fg);
		color: var(--bg);
		font-size: var(--size);
		border-radius: 50%;
		overflow: hidden;
		border: 1.5px solid var(--bg);
	}
</style>
