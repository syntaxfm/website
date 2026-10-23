import { applyAction, type ActionResult } from '$app/forms';
import { refreshAll } from '$app/navigation';
import toast from 'svelte-french-toast';
import { loading } from '$state/loading';

type FormActionMessage = {
	message?: string;
};

export const form_action = (
	opts?: FormActionMessage,
	pre?: (data?: any | unknown) => any,
	callback?: (
		data?: any | unknown,
		{ formElement }?: { formElement: HTMLFormElement }
	) => any | unknown
) => {
	return function form_enhance({ formElement }: { formElement: HTMLFormElement }) {
		if (pre) pre();
		loading.setLoading(true);
		return async ({ result }: { result: ActionResult<{ message: string }> }) => {
			console.log(result);
			if (result.type === 'success') {
				toast.success(`Success! ${result?.data?.message}`);
			} else if (result.type === 'error') {
				toast.error(`Major bummer: ${result.error.message}`);
			} else if (result.type === 'failure') {
				toast.error(`Failure: ${result.data?.message}`);
			} else {
				toast.error(`Something went wrong. Check the console`);
				console.log(result);
			}
			await refreshAll();
			await applyAction(result);
			loading.setLoading(false);
			if (callback && 'data' in result && result?.data)
				callback(result.data, {
					// Pass the form element to the callback so it can be used to reset the form
					formElement
				});
		};
	};
};
