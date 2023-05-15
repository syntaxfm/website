import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

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
			$themes: 'src/themes',
		}
	},

};

export default config;
