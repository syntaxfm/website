<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from './form_action';
	interface Props {
		text: string;
		thinking_text: string;
		action_path: string;
		children?: import('svelte').Snippet;
	}

	let { text, thinking_text, action_path, children }: Props = $props();

	let thinking = $state(false);
</script>

<form
	action={action_path}
	method="POST"
	use:enhance={form_action(
		{},
		() => {
			thinking = true;
		},
		() => {
			thinking = false;
		}
	)}
>
	{@render children?.()}
	<button disabled={thinking} type="submit">{thinking ? thinking_text : text}</button>
</form>
