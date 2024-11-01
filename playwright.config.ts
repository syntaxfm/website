const config = {
	webServer: {
		command: 'pnpm build:svelte && pnpm preview',
		port: 4173,
		timeout: 600000
	},
	testDir: 'tests'
};

export default config;
