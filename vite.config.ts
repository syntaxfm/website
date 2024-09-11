import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { codecovSvelteKitPlugin } from '@codecov/sveltekit-plugin';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			sentrySvelteKit({
				sourceMapsUploadOptions: {
					org: 'syntax-fm',
					project: 'website',
					authToken: env.SENTRY_AUTH_TOKEN
				}
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
			devSourcemap: true,
			preprocessorOptions: {
				postcss: {
					additionalData: `
				@custom-media --below-small (width < 400px);
				@custom-media --below-med (width < 700px);
				@custom-media --below-large (width < 900px);
				@custom-media --below-xlarge (width < 1200px);

				@custom-media --above-small (width > 400px);
				@custom-media --above-med (width > 700px);
				@custom-media --above-large (width > 900px);
				@custom-media --above-xlarge (width > 1200px);
				`
				}
			}
		},
		ssr: {
			external: ['@sentry/profiling-node']
		},
		esbuild: {
			exclude: '@sentry/profiling-node'
		},
		resolve: {
			alias: {
				'.prisma/client/index-browser': './node_modules/@prisma/client/index-browser.js'
			}
		},
		define: {
			__VER__: JSON.stringify(env.npm_package_version)
		}
	};
});
