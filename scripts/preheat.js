#!/usr/bin/env node
// One-command local setup: dependencies, Docker Postgres, production data, migrations.
// Env comes from .env.schema via varlock (see .env.schema for 1Password + .env.local).
//
//   pnpm preheat   Full setup. Copies prod into the local DB only if the local DB is empty.
//   pnpm db:pull   Replace the local DB with a fresh copy of prod, then apply pending migrations.
//
// Uses only Node built-ins so it can run on a fresh clone, before `pnpm install`.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
// Keep in sync with @initOp in .env.schema and the op:// references in .env.1password.
const OP_ACCOUNT = 'sentry.1password.com';
const OP_VAULT = '4bk5tuz4wmhcgb6lqu56rt4h64'; // Syntax.fm
// Local Syntax Auth's "Continue as Local Developer" account always has this central user ID.
const LOCAL_DEVELOPER_ID = 'local-developer';

const args = new Set(process.argv.slice(2));
const pull_only = args.has('--pull');
const assume_yes = args.has('--yes') || args.has('-y');

class SetupError extends Error {}

async function main() {
	check_node();
	check_pnpm();
	check_docker();

	clean_legacy_env();
	await setup_1password();

	if (!pull_only) {
		step('Installing dependencies');
		run('pnpm', ['install']);
	}

	validate_env();

	step('Starting local Postgres (docker compose)');
	run('docker', ['compose', 'up', '--detach', '--wait', 'db']);
	ok('Postgres is up on localhost:5434');

	const has_data = local_has_tables();

	if (pull_only || !has_data) {
		const prod_url = await resolve_prod_database_url();
		if (has_data && !(await confirm('This replaces your local database. Continue?'))) {
			throw new SetupError('Cancelled');
		}
		pull_prod(prod_url);
	} else {
		ok('Local database already has data (run pnpm db:pull to refresh from prod)');
	}

	baseline_untracked_migrations();

	step('Applying migrations');
	run('pnpm', ['exec', 'drizzle-kit', 'migrate'], {
		// drizzle.config.ts prefers POSTGRES_DATABASE_URL; make sure it can only see the local DB.
		env: { ...process.env, DATABASE_URL: LOCAL_DATABASE_URL, POSTGRES_DATABASE_URL: '' }
	});

	grant_local_developer_admin();

	console.log('\n🥘 Website preheated to 450°F (232°C)');
	if (!pull_only) console.log('   Run pnpm dev → http://localhost:5740');
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

// ─── Env ─────────────────────────────────────────────────────────────────────

// Pre-varlock setups kept everything in .env, which varlock still loads. Make sure none of it
// can point local dev at production.
function clean_legacy_env() {
	if (!existsSync('.env')) return;
	step('Checking legacy .env');

	let env = read_env('.env');

	// Local dev must always talk to the Docker DB.
	if (env.DATABASE_URL && !is_local_postgres(env.DATABASE_URL)) {
		set_env_var('.env', 'DATABASE_URL', LOCAL_DATABASE_URL);
		ok('DATABASE_URL → local Docker Postgres');
	}

	// Pre-v3 .env files: PROD_DATABASE_URL was MySQL, and prod Postgres lived in
	// POSTGRES_DATABASE_URL — which the app prefers over DATABASE_URL, so dev hit prod.
	if (env.PROD_DATABASE_URL && !is_postgres(env.PROD_DATABASE_URL)) {
		set_env_var('.env', 'PROD_DATABASE_URL', '');
		env = read_env('.env');
		ok('Cleared legacy MySQL PROD_DATABASE_URL');
	}
	if (env.POSTGRES_DATABASE_URL && !is_local_postgres(env.POSTGRES_DATABASE_URL)) {
		if (env.PROD_DATABASE_URL && env.PROD_DATABASE_URL !== env.POSTGRES_DATABASE_URL) {
			throw new SetupError(
				'POSTGRES_DATABASE_URL points at a remote database and overrides DATABASE_URL.\n' +
					'   Remove it from .env so local dev uses the Docker DB.'
			);
		}
		set_env_var('.env', 'PROD_DATABASE_URL', env.POSTGRES_DATABASE_URL);
		remove_env_var('.env', 'POSTGRES_DATABASE_URL');
		ok('Moved remote POSTGRES_DATABASE_URL → PROD_DATABASE_URL (dev no longer hits prod)');
	}

	ok('.env');
}

// ─── 1Password ───────────────────────────────────────────────────────────────

// USE_1PASSWORD in .env.local switches .env.1password on (see .env.schema). Asked once per machine.
async function setup_1password() {
	step('Checking 1Password');
	let use_1password = existsSync('.env.local') ? read_env('.env.local').USE_1PASSWORD : undefined;

	if (use_1password === undefined) {
		if (!process.stdin.isTTY) {
			ok('Skipping 1Password (not interactive) — set USE_1PASSWORD in .env.local');
			return;
		}
		const answer = await prompt(
			'Load secrets from the Syntax.fm 1Password vault? Core team only (y/N) '
		);
		use_1password = String(/^y(es)?$/i.test(answer));
		set_env_var('.env.local', 'USE_1PASSWORD', use_1password);
	}

	if (use_1password !== 'true') {
		ok('Using local defaults (USE_1PASSWORD=false in .env.local)');
		return;
	}

	await ensure_op_cli();
	check_op_vault_access();
	ok('Syntax.fm vault is reachable');
}

async function ensure_op_cli() {
	const version = spawnSync('op', ['--version'], { encoding: 'utf8' });
	if (!version.error && version.status === 0) {
		ok(`1Password CLI ${version.stdout.trim()}`);
		return;
	}

	const has_brew = spawnSync('brew', ['--version'], { stdio: 'ignore' }).status === 0;
	if (has_brew && process.stdin.isTTY) {
		const answer = await prompt('1Password CLI not found. Install it with Homebrew? (Y/n) ');
		if (!/^n/i.test(answer)) {
			run('brew', ['install', '1password-cli']);
			ok('Installed 1Password CLI');
			return;
		}
	}

	throw new SetupError(
		'1Password CLI not found. Install it (https://www.1password.dev/cli/get-started/)\n' +
			'   or set USE_1PASSWORD=false in .env.local, then re-run.'
	);
}

function check_op_vault_access() {
	console.log('   Approve the 1Password prompt if one appears…');
	// op waits for the app to be unlocked/approved; don't hang forever if nobody does.
	const result = spawnSync('op', ['vault', 'get', OP_VAULT, '--account', OP_ACCOUNT], {
		encoding: 'utf8',
		timeout: 60_000
	});
	if (result.status === 0) return;
	if (result.error?.code === 'ETIMEDOUT') {
		throw new SetupError(
			'Timed out waiting for 1Password. Unlock the 1Password app, approve the prompt, then re-run.'
		);
	}

	const error = result.stderr ?? '';
	if (/couldn't connect to the 1Password desktop app|No accounts configured/i.test(error)) {
		throw new SetupError(
			"The 1Password CLI can't reach the 1Password app. Open 1Password, unlock it, and turn on\n" +
				'   Settings → Developer → "Integrate with 1Password CLI", then re-run.'
		);
	}
	if (/no account found|found no accounts for filter/i.test(error)) {
		throw new SetupError(
			`${OP_ACCOUNT} isn't signed in to your 1Password app. Add your Sentry account\n` +
				'   in the 1Password app, then re-run.'
		);
	}
	throw new SetupError(
		`Can't open the Syntax.fm vault in ${OP_ACCOUNT}:\n   ${error.trim()}\n` +
			'   Ask a Syntax team admin for vault access, or set USE_1PASSWORD=false in .env.local.'
	);
}

// ─── Env validation ──────────────────────────────────────────────────────────

// Resolves every var in .env.schema (including 1Password) so problems surface now, not in pnpm dev.
function validate_env() {
	step('Validating env (.env.schema)');
	const result = spawnSync('pnpm', ['exec', 'varlock', 'load', '--agent'], { encoding: 'utf8' });
	if (result.status !== 0) {
		console.error(result.stdout, result.stderr);
		throw new SetupError('Env is invalid — see the errors above');
	}
	ok('Env is valid');
}

// Resolved through varlock, so it comes from 1Password when USE_1PASSWORD=true.
async function resolve_prod_database_url() {
	step('Resolving PROD_DATABASE_URL');
	let url = run('pnpm', ['exec', 'varlock', 'printenv', 'PROD_DATABASE_URL'], {
		capture: true
	}).trim();

	if (!url && process.stdin.isTTY) {
		url = await prompt('Production Postgres URL (read-only is fine): ');
		if (url) set_env_var('.env.local', 'PROD_DATABASE_URL', url);
	}

	if (!url) {
		throw new SetupError(
			'PROD_DATABASE_URL is not set. The local DB is built from a copy of prod —\n' +
				'   core team: set USE_1PASSWORD=true in .env.local, or put a read-only\n' +
				'   PlanetScale connection string in .env.local as PROD_DATABASE_URL.'
		);
	}
	if (!is_postgres(url)) {
		throw new SetupError('PROD_DATABASE_URL must be a postgres:// or postgresql:// URL');
	}
	if (is_local_postgres(url)) {
		throw new SetupError('PROD_DATABASE_URL points at localhost — it should be production');
	}

	ok('PROD_DATABASE_URL');
	return url;
}

function read_env(file) {
	return parseEnv(readFileSync(file, 'utf8'));
}

function set_env_var(file, key, value) {
	const content = existsSync(file) ? readFileSync(file, 'utf8') : '';
	const line = `${key}='${value}'`;
	const pattern = new RegExp(`^${key}=.*$`, 'm');
	const next = pattern.test(content)
		? content.replace(pattern, () => line)
		: `${content.replace(/\n?$/, '\n')}${line}\n`;
	writeFileSync(file, next.replace(/^\n/, ''));
}

function remove_env_var(file, key) {
	const content = readFileSync(file, 'utf8');
	writeFileSync(file, content.replace(new RegExp(`^${key}=.*\\n?`, 'm'), ''));
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

// Lets "Continue as Local Developer" into /admin. Only ever runs against the local Docker DB.
// github_id is required and unique; real GitHub IDs start at 1, so 0 can't collide.
function grant_local_developer_admin() {
	psql(`
		insert into roles (name) values ('admin') on conflict (name) do nothing;
		insert into profiles (central_user_id, github_id, username, name)
		values ('${LOCAL_DEVELOPER_ID}', 0, '${LOCAL_DEVELOPER_ID}', 'Local Developer')
		on conflict (central_user_id) do nothing;
		insert into profile_roles (profile_id, role_id)
		select profiles.id, roles.id from profiles, roles
		where profiles.central_user_id = '${LOCAL_DEVELOPER_ID}' and roles.name = 'admin'
		on conflict (profile_id, role_id) do nothing;
	`);
	ok(`${LOCAL_DEVELOPER_ID} is an admin locally`);
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
