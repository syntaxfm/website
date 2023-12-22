<script lang="ts">
	import toast from 'svelte-french-toast';
	import ColorsInJs from './colors-in-js.svelte';
	import { oklchToRgba, rgbaToHex } from '$/utilities/colors';

	const COLORS = ['black', 'yellow', 'teal', 'green', 'red', 'purple'];
	let type: 'VARIABLE' | 'OKLCH' | 'RGBA' | 'HEX';

	function pick_color(index: number) {
		if (index >= 5) {
			return 1;
		} else if (index < 5) {
			return 8;
		}
		return Math.abs(index - 9);
	}

	function copy_color(color: string, currentTarget: HTMLElement) {
		let local_color = color;
		if (type === 'OKLCH') {
			local_color = getComputedStyle(document.documentElement).getPropertyValue(`--${color}`);
		} else if (type === 'VARIABLE') {
			local_color = `var(--${color})`;
		} else if (type === 'RGBA') {
			local_color = oklchToRgba(getComputedStyle(currentTarget).backgroundColor);
		} else if (type === 'HEX') {
			let oklch = oklchToRgba(getComputedStyle(currentTarget).backgroundColor);
			local_color = rgbaToHex(oklch);
		}

		navigator.clipboard.writeText(local_color);
		toast.success(`Copied ${local_color} to clipboard`);
	}
</script>

<label>
	<select bind:value={type} name="" id="">
		<option value="HEX">HEX</option>
		<option value="VARIABLE">Variable</option>
		<option value="OKLCH">OKLCH</option>
		<option value="RGBA">RGBA</option>
	</select>
</label>

<section>
	{#each COLORS as color}
		<div class="wrapper">
			<div
				tabindex="0"
				role="button"
				on:keydown={(e) => {
					let { currentTarget } = e;
					if (e.key === 'Enter' || e.keyCode === 13) {
						copy_color(color, currentTarget);
					}
				}}
				class="primary box"
				on:click={({ currentTarget }) => copy_color(color, currentTarget)}
				style={`--fg_demo_box_color: var(--${color})`}
			>
				{color}
			</div>
			{#each Array(10) as item, index}
				<div
					tabindex="0"
					role="button"
					on:keydown={(e) => {
						let { currentTarget } = e;
						if (e.key === 'Enter' || e.keyCode === 13) {
							copy_color(color, currentTarget);
						}
					}}
					on:click={({ currentTarget }) => copy_color(`${color}-${index + 1}`, currentTarget)}
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

	<ColorsInJs />
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
