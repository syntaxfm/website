import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineNode, z } from '@midscene/test';
import { defineFileSetup, defineProjectSetup, defineTestProject } from '@midscene/test/config';
import { createMidsceneNodes } from '@midscene/test/midscene';
import { PlaywrightAgent } from '@midscene/web/playwright/agent';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { preview } from 'vite';

const APP_URL = 'http://127.0.0.1:4180';
const EPISODE = '/show/9999/timestamp-sharing-test';
interface Project {
	browser: Browser;
}
interface Context extends Project {
	session: BrowserContext;
	page: Page;
	agent?: PlaywrightAgent;
	position?: number;
	shared_url?: URL;
}

// A real, seekable three-minute PCM audio file, generated without ffmpeg or a CDN.
function audio_fixture() {
	const samples = 8000 * 180;
	const wav = Buffer.alloc(44 + samples * 2);
	wav.write('RIFF');
	wav.writeUInt32LE(wav.length - 8, 4);
	wav.write('WAVEfmt ', 8);
	wav.writeUInt32LE(16, 16);
	wav.writeUInt16LE(1, 20);
	wav.writeUInt16LE(1, 22);
	wav.writeUInt32LE(8000, 24);
	wav.writeUInt32LE(16000, 28);
	wav.writeUInt16LE(2, 32);
	wav.writeUInt16LE(16, 34);
	wav.write('data', 36);
	wav.writeUInt32LE(samples * 2, 40);
	return wav;
}
const setup = defineProjectSetup<Project>({
	name: 'local-syntax',
	async setup({ onTeardown }) {
		const wav = audio_fixture();
		const media = createServer((req, res) => {
			if (req.url !== '/midscene-fixture.wav') {
				res.writeHead(404).end();
				return;
			}
			const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
			const start = range ? Number(range[1]) : 0;
			const end = range?.[2] ? Math.min(Number(range[2]), wav.length - 1) : wav.length - 1;
			if (start > end || start >= wav.length) {
				res.writeHead(416).end();
				return;
			}
			res.writeHead(range ? 206 : 200, {
				'Content-Type': 'audio/wav',
				'Access-Control-Allow-Origin': '*',
				'Accept-Ranges': 'bytes',
				'Content-Length': end - start + 1,
				...(range ? { 'Content-Range': `bytes ${start}-${end}/${wav.length}` } : {})
			});
			res.end(wav.subarray(start, end + 1));
		});
		await new Promise<void>((resolve, reject) => {
			media.once('error', reject);
			media.listen(4181, '127.0.0.1', resolve);
		});
		onTeardown(
			() => new Promise<void>((resolve, reject) => media.close((e) => (e ? reject(e) : resolve())))
		);
		const server = await preview({
			root: fileURLToPath(new URL('../../', import.meta.url)),
			preview: { host: '127.0.0.1', port: 4180, strictPort: true }
		});
		onTeardown(
			() =>
				new Promise<void>((resolve, reject) =>
					server.httpServer.close((e) => (e ? reject(e) : resolve()))
				)
		);
		const browser = await chromium.launch({
			channel: process.env.BROWSER_CHANNEL || 'chrome',
			headless: process.env.HEADLESS !== 'false'
		});
		onTeardown(() => browser.close());
		return { browser };
	}
});
async function new_session(browser: Browser) {
	const session = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
		locale: 'en-US',
		permissions: ['clipboard-read', 'clipboard-write']
	});
	// Suppress third-party analytics, not application or media requests.
	await session.route(/sentry\.io|\/api\/57475\/3v3n7/, (route) => route.abort());
	await session.addInitScript(() => {
		// Observe actual browser playback, without changing media methods or player state.
		(window as any).__first_audio_play = null;
		document.addEventListener(
			'play',
			(event) => {
				if (
					event.target instanceof HTMLAudioElement &&
					(window as any).__first_audio_play === null
				) {
					(window as any).__first_audio_play = {
						time: event.target.currentTime,
						src: event.target.currentSrc
					};
				}
			},
			true
		);
	});
	return session;
}
const file_setup = defineFileSetup<Context, Project>({
	name: 'fresh-listener',
	async setup({ projectContext, onTeardown }) {
		assert.ok(projectContext);
		const session = await new_session(projectContext.browser);
		const context: Context = { ...projectContext, session, page: await session.newPage() };
		onTeardown(async () => {
			await context.agent?.destroy();
			await context.session.close();
		});
		await context.page.goto(APP_URL + EPISODE, { waitUntil: 'domcontentloaded' });
		await context.page.getByTestId('play-show').waitFor();
		return context;
	}
});
const empty = z.strictObject({});
const snapshot = defineNode<typeof empty, void, Context>({
	name: 'media.remember',
	description: 'Read the paused audio position after the user seeks with visible controls.',
	inputSchema: empty,
	async execute({ context }) {
		const state = await context.page.locator('audio').evaluate((audio: HTMLAudioElement) => ({
			time: audio.currentTime,
			paused: audio.paused,
			duration: audio.duration
		}));
		assert.ok(state.paused, 'Pause before sharing so the expected position is stable');
		assert.ok(
			state.time >= 55 && state.time < 90,
			`Expected two 30-second skips, got ${state.time}`
		);
		assert.equal(state.duration, 180);
		context.position = Math.trunc(state.time);
	}
});
const link_schema = z.strictObject({ timestamp: z.boolean() });
const check_link = defineNode<typeof link_schema, void, Context>({
	name: 'share.check',
	description:
		'Read the real clipboard and compare the copied timestamp with the actual audio position.',
	inputSchema: link_schema,
	async execute({ context, input }) {
		const text = await context.page.evaluate(() => navigator.clipboard.readText());
		const url = new URL(text);
		assert.equal(url.origin, 'https://syntax.fm');
		assert.equal(url.pathname, '/9999');
		if (input.timestamp) {
			assert.ok(url.searchParams.has('t'), 'Share link must contain the timestamp');
			const parts = url.searchParams.get('t')!.split(':').map(Number);
			assert.equal(parts.length, 3);
			assert.equal(
				parts.reduce((total, part) => total * 60 + part, 0),
				context.position
			);
		} else {
			assert.equal(url.search, '', 'Unchecked sharing must omit the timestamp');
		}
		context.shared_url = url;
	}
});
const open_link = defineNode<typeof empty, void, Context>({
	name: 'share.open',
	description:
		'Open the copied short link in a new browser context with no saved listening history; map only its origin to localhost.',
	inputSchema: empty,
	async execute({ context }) {
		assert.ok(context.shared_url);
		await context.agent?.destroy();
		context.agent = undefined;
		await context.session.close();
		context.session = await new_session(context.browser);
		context.page = await context.session.newPage();
		await context.page.goto(APP_URL + context.shared_url.pathname + context.shared_url.search, {
			waitUntil: 'domcontentloaded'
		});
		await context.page.getByTestId('play-show').waitFor();
		const actual = new URL(context.page.url());
		assert.equal(actual.pathname, EPISODE);
		assert.equal(
			actual.search,
			context.shared_url.search,
			'The short-link redirect must retain the timestamp'
		);
	}
});
const playback = defineNode<typeof link_schema, void, Context>({
	name: 'media.check',
	description:
		'Check the actual first audio play event, episode identity and media source in the fresh context.',
	inputSchema: link_schema,
	async execute({ context, input }) {
		await context.page.waitForFunction(() => (window as any).__first_audio_play !== null);
		const first = await context.page.evaluate(
			() => (window as any).__first_audio_play as { time: number; src: string }
		);
		const expected = input.timestamp ? context.position! : 0;
		assert.ok(
			Math.abs(first.time - expected) < 2,
			`First playback must start at ${expected}s, got ${first.time}s`
		);
		assert.equal(first.src, 'http://127.0.0.1:4181/midscene-fixture.wav');
		assert.match(
			await context.page.locator('#player_show_title').innerText(),
			/9999.*Timestamp Sharing Test/
		);
	}
});
export default defineTestProject<Context, Project>({
	test: { maxConcurrentProjects: 1, maxConcurrentFiles: 1, testTimeout: 600000 },
	projects: [
		{ name: 'web', setup, fileSetup: file_setup, retry: 0, files: { include: ['cases/*.yaml'] } }
	],
	nodes: [
		snapshot,
		check_link,
		open_link,
		playback,
		...createMidsceneNodes<Context>({
			agentClass: PlaywrightAgent,
			getAgent({ context }) {
				return (context.agent ??= new PlaywrightAgent(context.page, {
					aiActionContext:
						'You are a web UI testing expert reporting your actions and results in English.'
				}));
			}
		})
	]
});
