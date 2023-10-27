#!zx

const LOCAL_BUILD_PATH = '.svelte-kit/output/server/';
const VERCEL_BUILD_BASE_PATH = '.vercel/output/functions';
async function go() {
	// if (!process.env.VERCEL) {
	// 	console.log(
	// 		`Skipping copy of ffmpeg.wasm to ${LOCAL_BUILD_PATH} because not running on Vercel`
	// 	);
	// 	return;
	// }
	const vercelFuncDirs = (await $`ls -1d ${VERCEL_BUILD_BASE_PATH}/*.func`).stdout
		.split('\n')
		.map((v) => v.trim())
		.filter((v) => v !== '');

	const outputDirs = [...vercelFuncDirs, LOCAL_BUILD_PATH];

	for (const outputDir of outputDirs) {
		await $`cp node_modules/@ffmpeg.wasm/core-mt/dist/core.wasm ${outputDir}`;
		await $`cp node_modules/@ffmpeg.wasm/core-mt/dist/core.worker.js ${outputDir}/core.worker.cjs`;
		await $`cp -r ./src/server/transcripts/audio ${outputDir}`;
	}
}

await go();
