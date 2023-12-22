<script lang="ts">
	import { browser } from '$app/environment';
	export let colors: [string, string][] = [['load', 'ing']];
	if (browser) {
		const wrapper = document.querySelector('.theme-wrapper');
		if (wrapper) {
			const variables = getComputedStyle(wrapper);
			colors = Object.values(variables)
				.filter((value) => {
					return value.startsWith('--');
				})
				.map((variableName) => {
					return [variableName, variables.getPropertyValue(variableName)];
				});
		}
	}
</script>

<div>
	<h2>Computed CSS Variables</h2>
	{#each colors as [val, key]}
		<p style:background={key}>{val} {key}</p>
	{/each}
</div>
