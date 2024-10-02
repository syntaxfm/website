import { includeIgnoreFile } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	{
		ignores: ['**/*.d.ts']
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
					format: ['snake_case'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow'
				},
				{
					selector: 'variable',
					modifiers: ['const'],
					format: ['snake_case', 'UPPER_CASE']
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
