// * Client side Middleware
// https://kit.svelte.dev/docs/hooks

import { dev } from '$app/environment';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [
		Sentry.browserProfilingIntegration(),
		Sentry.replayIntegration({
			maskAllText: false,
			blockAllMedia: false
		}),
		Sentry.metrics.metricsAggregatorIntegration()
	],
	profilesSampleRate: 1.0,
	environment: dev ? 'development' : 'production'
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
