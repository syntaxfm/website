<script lang="ts" generics="Input extends RemoteFormInput | void, Output">
	import type { RemoteForm, RemoteFormInput } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';
	import toast from 'svelte-french-toast';
	import type { HTMLAttributes } from 'svelte/elements';

	const {
		remote,
		children,
		...props
	}: { remote: RemoteForm<Input, Output>; children: Snippet } & HTMLAttributes<HTMLButtonElement> =
		$props();
</script>

<form
	{...remote.enhance(async (form) => {
		try {
			await form.submit();
			form.element.reset();
			toast.success(`Siiiiick ${remote.action} success`);
		} catch (error) {
			console.error(error);
			toast.error(`Something went wrong. Check the console`);
		}
	})}
>
	<button class="button" type="submit" {...props}>{@render children()}</button>
</form>
