import at_import from 'postcss-import';
import postcss_preset_env from 'postcss-preset-env';

const config = {
	plugins: [
		at_import(),
		postcss_preset_env({
			stage: 3,
			features: {
				'nesting-rules': true,
				'custom-media-queries': true,
				'media-query-ranges': true,
				'cascade-layers': false
			}
		})
	]
};

export default config;
