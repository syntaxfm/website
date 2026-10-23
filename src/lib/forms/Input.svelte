<script lang="ts">
	interface Props {
		label?: string;
		type?: HTMLInputElement['type'];
		value?: string;
		id: string;
		[key: string]: any;
	}

	let { label = '', type = 'text', value = $bindable(''), id, ...rest }: Props = $props();

	function typeAction(node: HTMLInputElement) {
		node.type = type;
	}
</script>

<div class="input">
	{#if label}<label for={id}>{label}</label>{/if}
	<input {...rest} use:typeAction bind:value {id} name={id} />
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
