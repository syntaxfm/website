<script lang="ts">
	import Icon, { type IconName } from '../Icon.svelte';

	interface Props {
		label: string;
		checked: boolean;
		on_icon: IconName;
		off_icon: IconName;
	}

	let { label, checked = $bindable(false), on_icon, off_icon }: Props = $props();
</script>

<div class="toggle" onclick={() => (checked = !checked)}>
	<button>
		<Icon name={on_icon} />
	</button>
	<button>
		<Icon name={off_icon} />
	</button>
</div>
