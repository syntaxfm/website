#!/usr/bin/env node
// One-command local setup: .env, dependencies, Docker Postgres, production data, migrations.
//
//   pnpm preheat   Full setup. Copies prod into the local DB only if the local DB is empty.
//   pnpm db:pull   Replace the local DB with a fresh copy of prod, then apply pending migrations.
//
// Uses only Node built-ins so it can run on a fresh clone, before `pnpm install`.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { parseEnv } from 'node:util';

const MIN_NODE_MAJOR = 22;
const LOCAL_DB = 'local';
const LOCAL_DB_USER = 'root';
const LOCAL_DATABASE_URL = 'postgresql://root:mysecretpassword@localhost:5434/local';
const MIGRATIONS_DIR = 'drizzle/pg-migrations';
// Production predates drizzle-kit migration tracking: its schema was built by the
// MySQL → Postgres migration script and matches the migrations up to and including this tag.
// Only used when a restored database has no drizzle.__drizzle_migrations table.
const UNTRACKED_PROD_BASELINE = '0001_puzzling_talos';

const args = new Set(process.argv.slice(2));
const pull_only = args.has('--pull');
const assume_yes = args.has('--yes') || args.has('-y');

class SetupError extends Error {}

async function main() {
	check_node();
	check_pnpm();
	check_docker();

	const env = await ensure_env();

	if (!pull_only) {
		step('Installing dependencies');
		run('pnpm', ['install']);
	}

	step('Starting local Postgres (docker compose)');
	run('docker', ['compose', 'up', '--detach', '--wait', 'db']);
	ok('Postgres is up on localhost:5434');

	const has_data = local_has_tables();

	if (pull_only || !has_data) {
		if (!env.PROD_DATABASE_URL) {
			throw new SetupError(
				'PROD_DATABASE_URL is not set in .env. The local DB is built from a copy of prod —\n' +
					'   grab a read-only connection string from PlanetScale and re-run.'
			);
		}
		if (has_data && !(await confirm('This replaces your local database. Continue?'))) {
			throw new SetupError('Cancelled');
		}
		pull_prod(env.PROD_DATABASE_URL);
	} else {
		ok('Local database already has data (run pnpm db:pull to refresh from prod)');
	}

	baseline_untracked_migrations();

	step('Applying migrations');
	run('pnpm', ['exec', 'drizzle-kit', 'migrate'], {
		// drizzle.config.ts prefers POSTGRES_DATABASE_URL; make sure it can only see the local DB.
		env: { ...process.env, DATABASE_URL: LOCAL_DATABASE_URL, POSTGRES_DATABASE_URL: '' }
	});

	console.log('\n🥘 Website preheated to 450°F (232°C)');
	if (!pull_only) console.log('   Run pnpm dev → http://localhost:5173');
}

// ─── Tooling checks ──────────────────────────────────────────────────────────

function check_node() {
	const major = Number(process.versions.node.split('.')[0]);
	if (major < MIN_NODE_MAJOR) {
		throw new SetupError(`Node ${MIN_NODE_MAJOR}+ required (found ${process.versions.node})`);
	}
	ok(`Node ${process.versions.node}`);
}

function check_pnpm() {
	const result = spawnSync('pnpm', ['--version'], { encoding: 'utf8' });
	if (result.status !== 0) {
		throw new SetupError('pnpm not found. Run `corepack enable` or `brew install pnpm`.');
	}
	ok(`pnpm ${result.stdout.trim()}`);
}

function check_docker() {
	const result = spawnSync('docker', ['info'], { stdio: 'ignore' });
	if (result.error) {
		throw new SetupError('Docker not found. Install Docker Desktop or OrbStack.');
	}
	if (result.status !== 0) throw new SetupError('Docker is installed but not running. Start it.');
	ok('Docker');
}

// ─── .env ────────────────────────────────────────────────────────────────────

async function ensure_env() {
	step('Checking .env');
	if (!existsSync('.env')) {
		copyFileSync('.env.example', '.env');
		ok('Copied .env.example → .env');
	}

	let env = read_env();

	// Local dev must always talk to the Docker DB.
	if (!is_local_postgres(env.DATABASE_URL)) {
		set_env_var('DATABASE_URL', LOCAL_DATABASE_URL);
		ok('DATABASE_URL → local Docker Postgres');
	}

	// Pre-v3 .env files: PROD_DATABASE_URL was MySQL, and prod Postgres lived in
	// POSTGRES_DATABASE_URL — which the app prefers over DATABASE_URL, so dev hit prod.
	if (env.PROD_DATABASE_URL && !is_postgres(env.PROD_DATABASE_URL)) {
		set_env_var('PROD_DATABASE_URL', '');
		env = read_env();
		ok('Cleared legacy MySQL PROD_DATABASE_URL');
	}
	if (env.POSTGRES_DATABASE_URL && !is_local_postgres(env.POSTGRES_DATABASE_URL)) {
		if (env.PROD_DATABASE_URL && env.PROD_DATABASE_URL !== env.POSTGRES_DATABASE_URL) {
			throw new SetupError(
				'POSTGRES_DATABASE_URL points at a remote database and overrides DATABASE_URL.\n' +
					'   Remove it from .env so local dev uses the Docker DB.'
			);
		}
		set_env_var('PROD_DATABASE_URL', env.POSTGRES_DATABASE_URL);
		remove_env_var('POSTGRES_DATABASE_URL');
		ok('Moved remote POSTGRES_DATABASE_URL → PROD_DATABASE_URL (dev no longer hits prod)');
	}

	add_missing_example_vars();
	env = read_env();

	if (!env.PROD_DATABASE_URL && process.stdin.isTTY) {
		const answer = await prompt('Production Postgres URL (read-only is fine): ');
		if (answer) {
			set_env_var('PROD_DATABASE_URL', answer);
			env = read_env();
		}
	}

	if (env.PROD_DATABASE_URL) {
		if (!is_postgres(env.PROD_DATABASE_URL)) {
			throw new SetupError('PROD_DATABASE_URL must be a postgres:// or postgresql:// URL');
		}
		if (is_local_postgres(env.PROD_DATABASE_URL)) {
			throw new SetupError('PROD_DATABASE_URL points at localhost — it should be production');
		}
	}

	ok('.env');
	return env;
}

function read_env() {
	return parseEnv(readFileSync('.env', 'utf8'));
}

function set_env_var(key, value) {
	const content = readFileSync('.env', 'utf8');
	const line = `${key}='${value}'`;
	const pattern = new RegExp(`^${key}=.*$`, 'm');
	const next = pattern.test(content)
		? content.replace(pattern, () => line)
		: `${content.replace(/\n?$/, '\n')}${line}\n`;
	writeFileSync('.env', next);
}

function remove_env_var(key) {
	const content = readFileSync('.env', 'utf8');
	writeFileSync('.env', content.replace(new RegExp(`^${key}=.*\\n?`, 'm'), ''));
}

function add_missing_example_vars() {
	const example_content = readFileSync('.env.example', 'utf8');
	const example = parseEnv(example_content);
	const current = read_env();
	const missing = Object.keys(example).filter((key) => !(key in current));
	if (missing.length === 0) return;

	const lines = example_content.split('\n').filter((line) => {
		const key = line.split('=')[0].trim();
		return missing.includes(key);
	});
	const content = readFileSync('.env', 'utf8');
	writeFileSync('.env', `${content.replace(/\n?$/, '\n')}${lines.join('\n')}\n`);
	ok(`Added missing vars from .env.example: ${missing.join(', ')}`);
}

function is_postgres(url) {
	return /^postgres(ql)?:\/\//.test(url ?? '');
}

function is_local_postgres(url) {
	if (!is_postgres(url)) return false;
	const { hostname } = new URL(url);
	return hostname === 'localhost' || hostname === '127.0.0.1';
}

// ─── Database ────────────────────────────────────────────────────────────────

function pull_prod(prod_url) {
	step(`Copying production data from ${new URL(prod_url).hostname}`);
	const started = Date.now();

	compose_exec(['dropdb', '-U', LOCAL_DB_USER, '--if-exists', '--force', LOCAL_DB]);
	compose_exec(['createdb', '-U', LOCAL_DB_USER, LOCAL_DB]);
	// The dump recreates the public schema itself.
	psql('drop schema public cascade');

	// pg_dump runs inside the container so its version matches the server and nobody needs
	// Postgres client tools installed. The URL is passed via env to keep it out of argv.
	const pipeline = [
		'pg_dump --format=custom --no-owner --no-privileges',
		'--schema=public --schema=drizzle "$PROD_DATABASE_URL"',
		`| pg_restore --no-owner --no-privileges --exit-on-error -U ${LOCAL_DB_USER} -d ${LOCAL_DB}`
	].join(' ');
	compose_exec(['-e', 'PROD_DATABASE_URL', 'db', 'bash', '-o', 'pipefail', '-c', pipeline], {
		env: { ...process.env, PROD_DATABASE_URL: prod_url },
		with_service: false
	});

	const size = psql(`select pg_size_pretty(pg_database_size('${LOCAL_DB}'))`);
	ok(`Restored ${size} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

function local_has_tables() {
	return (
		Number(psql(`select count(*) from information_schema.tables where table_schema = 'public'`)) > 0
	);
}

// drizzle-kit migrate replays every migration unless it finds them recorded in
// drizzle.__drizzle_migrations. If a restored DB has tables but no tracking table, record the
// migrations its schema already reflects so only newer ones run.
function baseline_untracked_migrations() {
	const tracked = psql(`select to_regclass('drizzle.__drizzle_migrations') is not null`) === 't';
	if (tracked || !local_has_tables()) return;

	const { entries } = JSON.parse(readFileSync(`${MIGRATIONS_DIR}/meta/_journal.json`, 'utf8'));
	const baseline_index = entries.findIndex((entry) => entry.tag === UNTRACKED_PROD_BASELINE);
	if (baseline_index === -1) {
		throw new SetupError(`Baseline migration ${UNTRACKED_PROD_BASELINE} not found in journal`);
	}

	const values = entries.slice(0, baseline_index + 1).map((entry) => {
		const sql = readFileSync(`${MIGRATIONS_DIR}/${entry.tag}.sql`, 'utf8');
		const hash = createHash('sha256').update(sql).digest('hex');
		return `('${hash}', ${entry.when})`;
	});

	psql(`
		create schema if not exists drizzle;
		create table drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint);
		insert into drizzle.__drizzle_migrations (hash, created_at) values ${values.join(', ')};
	`);
	ok(`Marked migrations through ${UNTRACKED_PROD_BASELINE} as applied`);
}

function psql(sql) {
	return compose_exec(
		['psql', '-U', LOCAL_DB_USER, '-d', LOCAL_DB, '-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1'],
		{ input: sql, capture: true }
	).trim();
}

function compose_exec(command, { env, input, capture = false, with_service = true } = {}) {
	const argv = ['compose', 'exec', '-T', ...(with_service ? ['db'] : []), ...command];
	return run('docker', argv, { env, input, capture });
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function run(cmd, argv, { env, input, capture = false } = {}) {
	const result = spawnSync(cmd, argv, {
		env: env ?? process.env,
		input,
		encoding: 'utf8',
		stdio: [input === undefined ? 'inherit' : 'pipe', capture ? 'pipe' : 'inherit', 'inherit']
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		const shown = [cmd, ...argv.filter((arg) => !arg.includes('://'))].slice(0, 8).join(' ');
		throw new SetupError(`\`${shown}\` exited with ${result.status}`);
	}
	return result.stdout ?? '';
}

async function prompt(question) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		return (await rl.question(question)).trim();
	} finally {
		rl.close();
	}
}

async function confirm(question) {
	if (assume_yes) return true;
	if (!process.stdin.isTTY) {
		throw new SetupError('Refusing to overwrite the local database without --yes');
	}
	return /^y(es)?$/i.test(await prompt(`⚠️  ${question} (y/N) `));
}

function step(message) {
	console.log(`\n▸ ${message}`);
}

function ok(message) {
	console.log(`✅ ${message}`);
}

main().catch((error) => {
	if (error instanceof SetupError) {
		console.error(`\n❌ ${error.message}`);
	} else {
		console.error('\n❌ preheat failed', error);
	}
	process.exit(1);
});
