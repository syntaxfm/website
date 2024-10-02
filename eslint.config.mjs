import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		ignores: [
			'**/node_modules/**',
			'build/**',
			'.svelte-kit/**',
			'package/**',
			'**/*.d.ts',
			'.vercel/**'
		]
	},
	{
		files: ['**/*.{js,ts,svelte}'],
		plugins: {
			'@typescript-eslint': typescriptEslint
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				__VER__: 'readonly'
			},
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'@typescript-eslint/ban-ts-comment': 'error',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'default',
					format: null
				},
				{
					selector: 'variable',
					format: ['snake_case', 'UPPER_CASE'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow'
				},
				{
					selector: 'typeLike',
					format: ['PascalCase']
				},
				{
					selector: 'property',
					format: null
				}
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'variable',
					format: ['snake_case', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow'
				}
			]
		}
	}
];
