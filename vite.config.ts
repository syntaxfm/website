import adapter from '@sveltejs/adapter-cloudflare';
import at_import from 'postcss-import';
import postcss_preset_env from 'postcss-preset-env';
import preprocess from 'svelte-preprocess';
import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { codecovSvelteKitPlugin } from '@codecov/sveltekit-plugin';
import { syntax_auth } from '@syntaxfm/auth-local';
import { loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		server: {
			port: 5740
		},
		plugins: [
			// Dev server only: production gets its env from the host (Worker vars and secrets), not a varlock boot, and
			// tests need no secrets (so they never wait on 1Password). Imported lazily because loading
			// the module resolves the env as a side effect.
			command === 'serve' &&
				!process.env.VITEST &&
				import('@varlock/vite-integration').then(({ varlockVitePlugin }) => varlockVitePlugin()),
			// Dev only (apply: 'serve'): starts the shared local Syntax Auth on localhost:37960 and serves
			// sign-in at /__syntax_auth/ on whatever address the site is opened at. It reads
			// SYNTAX_AUTH_PUBLIC_ORIGINS from the shell itself; passing it here makes a value in .env.local
			// count too.
			syntax_auth({
				public_origins: (env.SYNTAX_AUTH_PUBLIC_ORIGINS ?? '').split(/[\s,]+/).filter(Boolean)
			}),
			sentrySvelteKit({
				sourceMapsUploadOptions: {
					org: 'syntax-fm',
					project: 'website',
					authToken: env.SENTRY_AUTH_TOKEN
				}
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
			`,

							plugins: [
								at_import,
								postcss_preset_env({
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
				compilerOptions: { experimental: { async: true } },
				experimental: { remoteFunctions: true },
				// Builds a Cloudflare Worker (.svelte-kit/cloudflare); settings live in wrangler.jsonc
				adapter: adapter(),
				alias: {
					$actions: 'src/actions',
					$assets: 'src/assets',
					$const: 'src/const.ts',
					$server: 'src/server',
					$shows: 'shows',
					$state: 'src/state',
					$styles: 'src/styles',
					$utilities: 'src/utilities'
				}
			}),

			codecovSvelteKitPlugin({
				enableBundleAnalysis: env.CODECOV_TOKEN !== undefined,
				bundleName: 'website',
				uploadToken: env.CODECOV_TOKEN
			}),
			VitePluginSvgSpritemap('./src/icons/*.svg', {
				prefix: 'icon-'
			})
		],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		},
		css: {
			devSourcemap: true
		},
		define: {
			APP_VERSION: JSON.stringify(env.npm_package_version)
		}
	};
});
