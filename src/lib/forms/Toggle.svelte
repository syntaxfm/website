<script lang="ts">
	import Icon, { type IconName } from '../Icon.svelte';

	interface Props {
		checked: boolean;
		on_icon: IconName[number];
		off_icon: IconName[number];
		onchange?: (checked: boolean) => void;
	}

	let { checked = $bindable(true), on_icon, off_icon, onchange }: Props = $props();
</script>

<div class="toggle">
	<div class="background" style={`translate: ${checked ? '0' : '100%'} 0px;`}></div>
	<button
		class={checked ? 'active' : ''}
		onclick={() => {
			checked = true;
			onchange?.(true);
		}}
		data-testid="toggle-on"
	>
		<Icon width={16} height={16} name={on_icon} />
	</button>
	<button
		class={!checked ? 'active' : ''}
		onclick={() => {
			checked = false;
			onchange?.(false);
		}}
		data-testid="toggle-off"
	>
		<Icon width={16} height={16} name={off_icon} />
	</button>
</div>

<style>
	.toggle {
		--size: 40px;

		width: auto;
		display: inline-flex;
		position: relative;
		background: var(--c-fg-1);
		border-radius: var(--size);

		.background {
			position: absolute;
			width: var(--size);
			height: var(--size);
			background: var(--c-primary);
			border-radius: 50%;
			transition: translate 0.3s ease;
			box-shadow: var(--s-light);
		}

		button {
			background: transparent;
			border-radius: 50%;
			padding: 0;
			width: var(--size);
			color: var(--fg);
			height: var(--size);
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			z-index: 1;
			&.active {
				color: var(--c-black);
			}
		}
	}
</style>
