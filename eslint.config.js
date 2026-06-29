import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const gitignore_path = path.resolve(_dirname, '.gitignore');

export default ts.config(
	includeIgnoreFile(gitignore_path),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	...storybook.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				__VER__: 'readonly'
			}
		},
		rules: {
			// typescript-eslint strongly recommends not using no-undef on TS projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Repo conventions — snake_case naming (ADR-0005) and strict ts-comment policy.
		rules: {
			'@typescript-eslint/ban-ts-comment': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
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
			]
		}
	},
	{
		// Svelte files additionally allow PascalCase locals (component references).
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
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
);
