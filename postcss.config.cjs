const postcssPresetEnv = require('postcss-preset-env');
const atImport = require('postcss-import');

const config = {
	plugins: [
		atImport(),
		postcssPresetEnv({
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
