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
				APP_VERSION: 'readonly'
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
					leadingUnderscore: 'allowSingleOrDouble',
					trailingUnderscore: 'allow'
				},
				{
					selector: 'variable',
					modifiers: ['const'],
					format: ['snake_case', 'UPPER_CASE'],
					leadingUnderscore: 'allowSingleOrDouble',
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
					leadingUnderscore: 'allowSingleOrDouble',
					trailingUnderscore: 'allow'
				}
			]
		}
	},
	{
		// Drizzle ORM uses camelCase JS bindings for snake_case tables (standard Drizzle convention);
		// renaming them cascades across every query/import for no benefit, and the table-export names
		// collide with relation keys. The seed endpoint mirrors these model names. See ADR-0005.
		files: [
			'src/server/db/schema.ts',
			'src/server/db/relations.ts',
			'src/routes/api/seed.json/content.server.ts'
		],
		rules: {
			'@typescript-eslint/naming-convention': 'off'
		}
	}
);
