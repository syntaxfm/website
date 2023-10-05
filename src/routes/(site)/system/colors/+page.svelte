<script lang="ts">
	import toast from 'svelte-french-toast';

	const COLORS = ['black', 'yellow', 'teal', 'green', 'red', 'purple'];
	let is_oklch: false;

	function pick_color(index: number) {
		if (index >= 5) {
			return 1;
		} else if (index < 5) {
			return 8;
		}
		return Math.abs(index - 9);
	}

	function copy_color(color: string) {
		let local_color = color;
		if (is_oklch) {
			local_color = getComputedStyle(document.documentElement).getPropertyValue(`--${color}`);
		} else {
			local_color = `var(--${color})`;
		}

		navigator.clipboard.writeText(local_color);
		toast.success(`Copied ${local_color} to clipboard`);
	}
</script>

<label>
	<input type="checkbox" bind:checked={is_oklch} />
	Copy OKLCH value
</label>

<section>
	{#each COLORS as color}
		<div class="wrapper">
			<div
				tabindex="0"
				role="button"
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.keyCode === 13) {
						copy_color(color);
					}
				}}
				class="primary box"
				on:click={() => copy_color(color)}
				style={`--fg_demo_box_color: var(--${color})`}
			>
				{color}
			</div>
			{#each Array(10) as item, index}
				<div
					tabindex="0"
					role="button"
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.keyCode === 13) {
							copy_color(color);
						}
					}}
					on:click={() => copy_color(`${color}-${index + 1}`)}
					class={`box`}
					style={`--fg_demo_color: var(--${color}-${pick_color(
						index
					)}); --fg_demo_box_color: var(--${color}-${index + 1});`}
				>
					{color}-{index + 1}
				</div>
			{/each}
		</div>
	{/each}
</section>

<style lang="postcss">
	section {
		display: flex;
		gap: 10px;
	}

	.primary {
		border: solid 5px var(--line-color);
	}

	.wrapper {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
		flex-grow: 1;
	}

	.box {
		cursor: pointer;
		display: flex;
		height: 100px;
		padding: 5%;
		justify-content: center;
		align-items: flex-end;
		background: var(--fg_demo_box_color);
		color: var(--fg_demo_color);
	}
</style>
