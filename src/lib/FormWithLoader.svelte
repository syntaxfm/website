<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { loading } from '$state/loading';
	import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
	import toast from 'svelte-french-toast';
	let formLoading = $state(false);
	interface Props {
		global?: boolean;
		confirm?: string;
		children?: import('svelte').Snippet<[any]>;
		[key: string]: any;
	}

	let { global = true, confirm = '', children, ...rest }: Props = $props();

	type FormActionMessage = {
		message?: string;
	};

	export const form_action = (
		opts?: FormActionMessage,
		callback?: (data: any | unknown) => any
	): SubmitFunction => {
		return function form_enhance({ cancel }) {
			if (global) {
				loading.setLoading(true);
			}
			if (confirm) {
				if (!window.confirm(confirm)) {
					return cancel();
				}
			}
			formLoading = true;
			return async ({ result }: { result: ActionResult<any, any> }) => {
				if (result.type === 'success') {
					toast.success('Siiiiick ' + result.data.message + ' was a success');
				} else if (result.type === 'error') {
					console.log(result);
					toast.error(`Major bummer: ${result.error.message}`);
				} else {
					toast.error(`Something went wrong. Check the console`);
					console.log(result);
				}
				await invalidateAll();
				await applyAction(result);
				formLoading = false;
				if (global) {
					loading.setLoading(false);
				}
				if (callback && 'data' in result && result?.data) callback(result.data);
			};
		};
	};
</script>

<form {...rest} use:enhance={form_action()}>
	{@render children?.({ loading: formLoading })}
</form>
