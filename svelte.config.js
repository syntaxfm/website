import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import postcssPresetEnv from 'postcss-preset-env';
import atImport from 'postcss-import';

/** @type {import('@sveltejs/kit').Config} */
const config = {
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

	kit: {
		adapter: adapter({
			runtime: 'nodejs22.x'
		}),
		alias: {
			$: 'src',
			$actions: 'src/actions',
			$assets: 'src/assets',
			$const: 'src/const.ts',
			$server: 'src/server',
			$shows: 'shows',
			$state: 'src/state',
			$styles: 'src/styles',
			$utilities: 'src/utilities'
		}
	}
};

export default config;
