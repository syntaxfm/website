import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import postcssPresetEnv from 'postcss-preset-env';
import atImport from 'postcss-import';
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

			sveltekit({
				preprocess: [
					preprocess({
						postcss: {
							prependData: `
				@custom-media --below-small (width < 400px);
				@custom-media --below-med (width < 700px);
				@custom-media --below-large (width < 900px);
				@custom-media --below-xlarge (width < 1200px);
				@custom-media --above-small (width > 400px);
				@custom-media --above-med (width > 700px);
				@custom-media --above-large (width > 900px);
				@custom-media --above-xlarge (width > 1200px);
				@custom-media --stacked-video-bar (max-width: 809px);
			`,

							plugins: [
								atImport,
								postcssPresetEnv({
									stage: 2,
									features: {
										'nesting-rules': true,
										'custom-media-queries': true,
										'media-query-ranges': true
									}
								})
							]
						}
					})
				],
				adapter: adapter({ runtime: 'nodejs22.x' })
			}),

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
