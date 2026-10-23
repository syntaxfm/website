// Runs `pnpm build` only when the inputs changed since the last build.
// Inputs are every file git knows about (tracked + untracked, minus .gitignore) and .env,
// minus files that only affect tests. Set FORCE_BUILD=1 to always build.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUTPUT_DIR = '.svelte-kit/output';
const STAMP_FILE = `${OUTPUT_DIR}/.build-hash`;
const IGNORED_PREFIXES = ['tests/', 'test-results/', '.github/', 'playwright.config.ts'];

function hash_inputs() {
	const files = execFileSync(
		'git',
		['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
		{
			encoding: 'utf8'
		}
	)
		.split('\0')
		.filter((file) => file && !IGNORED_PREFIXES.some((prefix) => file.startsWith(prefix)))
		.sort();
	// Env vars get baked into the build
	if (existsSync('.env')) files.push('.env');

	const hash = createHash('sha256');
	hash.update(process.version);
	for (const file of files) {
		// Deleted but not yet staged files are still listed by git
		if (!existsSync(file)) continue;
		hash.update(file);
		hash.update('\0');
		hash.update(readFileSync(file));
		hash.update('\0');
	}
	return hash.digest('hex');
}

const input_hash = hash_inputs();
const previous_hash = existsSync(STAMP_FILE) ? readFileSync(STAMP_FILE, 'utf8').trim() : null;

if (!process.env.FORCE_BUILD && previous_hash === input_hash) {
	console.log('No changes since the last build, reusing it. Set FORCE_BUILD=1 to rebuild.');
} else {
	execFileSync('pnpm', ['build'], { stdio: 'inherit' });
	writeFileSync(STAMP_FILE, input_hash);
}
