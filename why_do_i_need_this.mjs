#!zx
const LOCAL_BUILD_PATH = '.svelte-kit/output/server/';
const VERCEL_BUILD_BASE_PATH = '.vercel/output/functions';
const vercelFuncDirs = (await $`ls -1d ${VERCEL_BUILD_BASE_PATH}/*.func`).stdout
	.split('\n')
	.map((v) => v.trim())
	.filter((v) => v !== '');

const outputDirs = [...vercelFuncDirs, LOCAL_BUILD_PATH];

for (const outputDir of outputDirs) {
	// We have to explicitly copy the WASM files to the output directory of each serverless function because Sveltekit + Vercel have no way of knowing that they need to be copied via static analysis.
	console.log(`Copying WASM files to ${outputDir}.`);
	await $`cp node_modules/@ffmpeg.wasm/core-mt/dist/core.wasm ${outputDir}`;
	await $`cp node_modules/@ffmpeg.wasm/core-mt/dist/core.worker.js ${outputDir}/core.worker.cjs`;
	await $`cp -r ./src/server/transcripts/audio ${outputDir}`;
}
