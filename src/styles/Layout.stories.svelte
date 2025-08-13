<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'System/Layouts'
	});

	let flexgap = $state(10);
	let stackgap = $state(10);
</script>

<Story name="Default">
	<div style:--stack-gap="{stackgap}px" style:--flex-gap="{flexgap}px">
		<h2>.grid</h2>
		<div class="grid">
			<div class="box">1</div>
			<div class="box">2</div>
			<div class="box">3</div>
		</div>
		<h2>.flex</h2>
		<label
			>var(--flex-gap);
			<input type="range" min="0" max="100" bind:value={flexgap} />
		</label>
		<div class="flex">
			<div class="box">1</div>
			<div class="box">2</div>
			<div class="box">3</div>
		</div>
		<h2>.stack</h2>
		<label
			>var(--stack-gap);
			<input type="range" min="0" max="100" bind:value={stackgap} />
		</label>
		<div class="stack">
			<div class="box">1</div>
			<div class="box">2</div>
			<div class="box">3</div>
		</div>
		<h2>.stack-reverse</h2>
		<div class="stack-reverse">
			<div class="box">1</div>
			<div class="box">2</div>
			<div class="box">3</div>
		</div>
	</div>
</Story>

<style>
	.box {
		height: 100px;
		min-width: 100px;
		background-color: var(--c-black-3);
		margin: 10px;
		text-align: center;
		color: var(--c-black);
	}
</style>
