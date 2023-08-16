<script lang="ts">
	export let label = '';
	export let type: HTMLInputElement['type'] = 'text';
	export let value: string = '';

	function typeAction(node) {
		node.type = type;
	}
</script>

<div class="input">
	{#if label}<label for={label}>{label}</label>{/if}
	<input {...$$restProps} use:typeAction bind:value id={label} />
</div>

<style lang="postcss">
	div {
		position: relative;
		display: inline-block;
	}

	label {
		position: absolute;
		top: -40%;
		left: 0;
		font-size: var(--font-size-xs);
	}

	input {
		font-size: var(--font-size-base);
		padding: 8px 14px;
		border: none;
		box-shadow: inset 0 0 0 3px oklch(var(--blacklch) / 0.2);
		border-radius: 4px;
		width: 100%;
	}
</style>
