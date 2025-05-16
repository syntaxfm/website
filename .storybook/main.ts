import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap';
import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs'],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	viteFinal: async (config) => {
		config.plugins.push(VitePluginSvgSpritemap('./src/icons/*.svg'));
		return config;
	}
};
export default config;
