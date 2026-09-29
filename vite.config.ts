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
			// Dev server only: production gets its env from the host (Vercel), not a varlock boot, and
			// tests need no secrets (so they never wait on 1Password). Imported lazily because loading
			// the module resolves the env as a side effect.
			command === 'serve' &&
				!process.env.VITEST &&
				import('@varlock/vite-integration').then(({ varlockVitePlugin }) => varlockVitePlugin()),
			// Dev only (apply: 'serve'): starts the shared local Syntax Auth on localhost:37960.
			syntax_auth(),
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
			}),
			VitePluginSvgSpritemap('./src/icons/*.svg', {
				prefix: 'icon-'
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
		define: {
			APP_VERSION: JSON.stringify(env.npm_package_version)
		}
	};
});
