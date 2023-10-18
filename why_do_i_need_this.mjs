#!zx

const LOCAL_BUILD_PATH = '.svelte-kit/output/server/';
const VERCEL_BUILD_BASE_PATH = '.vercel/output/functions';

const vercelFuncDirs = (await $`ls -1d ${VERCEL_BUILD_BASE_PATH}/*.func`).stdout
	.split('\n')
	.map((v) => v.trim())
	.filter((v) => v !== '');

const outputDirs = [...vercelFuncDirs, LOCAL_BUILD_PATH];

for (const outputDir of outputDirs) {
	await $`copyfiles -u3 -e '**/*.ts' "src/lib/og-image/*" ${outputDir}`;
	await $`cp node_modules/@dimfeld/create-social-card-wasm/create_social_card_wasm_bg.wasm ${outputDir}`;
}
