<!-- @deprecated Use .remote() functions instead -->
<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { loading } from '$state/loading';
	import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
	import toast from 'svelte-french-toast';
	let form_loading = $state(false);

	interface Props {
		global?: boolean;
		confirm?: string;
		children?: import('svelte').Snippet<[{ loading: boolean }]>;
		[key: string]: unknown;
	}

	let { global = true, confirm = '', children, ...rest }: Props = $props();

	type FormActionMessage = {
		message?: string;
	};

	export const form_action = (
		opts?: FormActionMessage,
		callback?: (data: unknown) => void
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
			form_loading = true;
			return async ({ result }: { result: ActionResult<Record<string, unknown>> }) => {
				if (result.type === 'success') {
					toast.success('Siiiiick ' + String(result.data?.message) + ' was a success');
				} else if (result.type === 'error') {
					console.log(result);
					toast.error(`Major bummer: ${result.error.message}`);
				} else {
					toast.error(`Something went wrong. Check the console`);
					console.log(result);
				}
				await invalidateAll();
				await applyAction(result);
				form_loading = false;
				if (global) {
					loading.setLoading(false);
				}
				if (callback && 'data' in result && result?.data) callback(result.data);
			};
		};
	};
</script>

/** * @deprecated Use .remote() functions instead */
<form {...rest} use:enhance={form_action()}>
	{@render children?.({ loading: form_loading })}
</form>
