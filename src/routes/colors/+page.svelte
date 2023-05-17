<script lang="ts">
	const COLORS = ['yellow', 'teal', 'green'];
</script>

<section>
	{#each COLORS as color}
		<div class="wrapper">
			<div class="primary box" style={`--color_demo_box_color: var(--${color})`}>
				{color}
			</div>
			{#each Array(10) as item, index}
				<div class="box" style={`--color_demo_box_color: var(--${color}-${index + 1});`}>
					{color}-{index + 1}
				</div>
			{/each}
		</div>
	{/each}
</section>

<style>
	section {
		display: flex;
		gap: 20px;
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
		height: 100px;
		text-align: center;
		line-height: 100px;
		background: var(--color_demo_box_color);
	}
</style>
