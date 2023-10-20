<script lang="ts">
	import { browser } from '$app/environment';
	export let colors: [string, string][] = [['load', 'ing']];
	if (browser) {
		const variables = getComputedStyle(document.querySelector('.theme-wrapper'));
		console.log(variables);
		colors = Object.values(variables)
			.filter((value) => {
				return value.startsWith('--');
			})
			.map((variableName) => {
				return [variableName, variables.getPropertyValue(variableName)];
			});
	}
</script>

<div>
	<h2>Computed CSS Variables</h2>
	{#each colors as [val, key]}
		<p style:background={key}>{val} {key}</p>
	{/each}
</div>

<style>
</style>
