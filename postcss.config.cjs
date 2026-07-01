const postcss_preset_env = require('postcss-preset-env');
const at_import = require('postcss-import');

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

module.exports = config;
