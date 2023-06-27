const postcssPresetEnv = require('postcss-preset-env');
const atImport = require('postcss-import');

const config = {
	plugins: [
		atImport(),
		postcssPresetEnv({
			stage: 2,
			features: {
				'nesting-rules': true,
				'custom-media-queries': true,
				'media-query-ranges': true
			}
		}),
	]
};

module.exports = config;
