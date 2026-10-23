import { sentrySvelteKit } from '@sentry/sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { codecovSvelteKitPlugin } from '@codecov/sveltekit-plugin';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			sentrySvelteKit({
				org: 'syntax-fm',
				project: 'website',
				authToken: env.SENTRY_AUTH_TOKEN
			}),
			sveltekit(),
			codecovSvelteKitPlugin({
				enableBundleAnalysis: env.CODECOV_TOKEN !== undefined,
				bundleName: 'website',
				uploadToken: env.CODECOV_TOKEN
			})
		],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		},
		css: {
			devSourcemap: true
		},
		ssr: {
			external: ['@sentry/profiling-node']
		},
		resolve: {
			alias: {
				'.prisma/client/index-browser': fileURLToPath(
					new URL('./node_modules/@prisma/client/index-browser.js', import.meta.url)
				)
			}
		},
		define: {
			__VER__: JSON.stringify(env.npm_package_version)
		}
	};
});
