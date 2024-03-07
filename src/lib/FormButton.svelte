<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from './form_action';
	export let text: string;
	export let thinking_text: string;
	export let action_path: string;

	let thinking = false;
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
	<button disabled={thinking} type="submit">{thinking ? thinking_text : text}</button>
</form>
