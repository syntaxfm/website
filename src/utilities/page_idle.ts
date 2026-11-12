// Safari has no requestIdleCallback
const IDLE_FALLBACK_MS = 1000;
const IDLE_TIMEOUT_MS = 5000;

/**
 * Resolves once the page has finished loading and the browser has a quiet moment. For work that
 * must never slow the page down.
 */
export function page_idle(): Promise<void> {
	return new Promise((resolve) => {
		const wait_for_quiet = () => {
			if (typeof requestIdleCallback === 'function') {
				requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
			} else {
				setTimeout(resolve, IDLE_FALLBACK_MS);
			}
		};
		if (document.readyState === 'complete') wait_for_quiet();
		else window.addEventListener('load', wait_for_quiet, { once: true });
	});
}
