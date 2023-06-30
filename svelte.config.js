import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';
import postcssPresetEnv from 'postcss-preset-env';
import atImport from 'postcss-import';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		preprocess({
			postcss: {
				prependData: `
				@custom-media --below_small (width < 400px);
				@custom-media --below_med (width < 700px);
				@custom-media --below_large (width < 900px);
				@custom-media --below_xlarge (width < 1200px);

				@custom-media --above_small (width > 400px);
				@custom-media --above_med (width > 700px);
				@custom-media --above_large (width > 900px);
				@custom-media --above_xlarge (width > 1200px);
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
		adapter: adapter(),
		alias: {
			$shows: 'shows',
			$state: 'src/state',
			$assets: 'src/assets',
			$db: 'src/db',
			$const: 'src/const.ts',
			$actions: 'src/actions',
			$utilities: 'src/utilities',
			$themes: 'src/themes'
		}
	}
};

export default config;
