import { beforeNavigate } from '$app/navigation';
import { navigating } from '$app/stores';
import { onDestroy } from 'svelte';

function getNavigationStore() {
	const callbacks = [];

	const navigation = {
		...navigating,
		complete: async () => {
			await new Promise((res, _) => {
				callbacks.push(res);
			});
		}
	};

	// This used to subscribe inside the callback, but that resolved the promise too early
	const unsubscribe = navigating.subscribe((state) => {
		if (state === null) {
			while (callbacks.length > 0) {
				const res = callbacks.pop();
				res?.();
			}
		}
	});

	onDestroy(() => {
		unsubscribe();
	});

	return navigation;
}

export const preparePageTransition = () => {
	const navigation = getNavigationStore();

	// before navigating, start a new transition
	beforeNavigate(() => {
		if (!document.startViewTransition) {
			return;
		}
		const navigationComplete = navigation.complete();

		document.startViewTransition(async () => {
			await navigationComplete;
		});
	});
};
