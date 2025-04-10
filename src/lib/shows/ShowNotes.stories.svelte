<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ShowNotes from './ShowNotes.svelte';

	const { Story } = defineMeta({
		title: 'Shows/ShowNotes',
		component: ShowNotes
	});
</script>

<Story
	name="Default"
	args={{
		show_notes: `<p>Scott walks Wes through the new Syntax Production Assistant Desktop App, designed to streamline and automate their complex publishing process. From tech stack choices like Svelte5 and Rust to AI-driven features, they dive into how this tool keeps everything consistent.</p>
<h3 id="show-notes">Show Notes<a aria-hidden="true" tabindex="-1" href="#show-notes"><span class="icon icon-link"></span></a></h3>
<ul>
<li><strong><a href="#t=00:00">00:00</a></strong> Welcome to Syntax!</li>
<li><strong><a href="#t=00:44">00:44</a></strong> Brought to you by <a href="https://sentry.io/syntax">Sentry.io</a>.</li>
<li><strong><a href="#t=01:37">01:37</a></strong> What was the idea?</li>
<li><strong><a href="#t=05:42">05:42</a></strong> The tech.
<ul>
<li><a href="https://svelte.dev/blog/svelte-5-release-candidate">Svelte5</a>, <a href="https://tauri.app/">Tauri</a>, <a href="https://www.rust-lang.org/">Rust</a>, <a href="https://www.ffmpeg.org/">FFMPEG</a>.</li>
</ul>
</li>
<li><strong><a href="#t=08:32">08:32</a></strong> Markdown editor.
<ul>
<li><a href="https://github.com/davidmyersdev/ink-mde">ink-mde</a>, <a href="https://dillinger.io/">Dillinger</a>.</li>
</ul>
</li>
<li><strong><a href="#t=09:32">09:32</a></strong> Epoch timestamps.
<ul>
<li><a href="https://epoch.vercel.app/">Epoch.vercel</a>.</li>
</ul>
</li>
<li><strong><a href="#t=10:01">10:01</a></strong> Updating front-matter.</li>
<li><strong><a href="#t=10:10">10:10</a></strong> <a href="https://dexie.org/">Dexie.js</a> function.</li>
<li><strong><a href="#t=11:25">11:25</a></strong> Backing up data.</li>
<li><strong><a href="#t=11:58">11:58</a></strong> Rust functions.</li>
<li><strong><a href="#t=12:58">12:58</a></strong> Why a desktop app and not a website?</li>
<li><strong><a href="#t=14:38">14:38</a></strong> Some small AI features.</li>
<li><strong><a href="#t=16:26">16:26</a></strong> Challenges with <a href="https://oauth.net/2/">OAuth</a>.</li>
<li><strong><a href="#t=20:03">20:03</a></strong> Publishing challenges.</li>
<li><strong><a href="#t=23:29">23:29</a></strong> Could this work on Windows?</li>
<li><strong><a href="#t=23:54">23:54</a></strong> Debugging.</li>
<li><strong><a href="#t=26:23">26:23</a></strong> Deciphering Apple logs.</li>
</ul>
<h3 id="hit-us-up-on-socials">Hit us up on Socials!<a aria-hidden="true" tabindex="-1" href="#hit-us-up-on-socials"><span class="icon icon-link"></span></a></h3>
<p>Syntax: <a href="https://twitter.com/syntaxfm">X</a> <a href="https://www.instagram.com/syntax_fm/">Instagram</a> <a href="https://www.tiktok.com/@syntaxfm">Tiktok</a> <a href="https://www.linkedin.com/company/96077407/admin/feed/posts/">LinkedIn</a> <a href="https://www.threads.net/@syntax_fm">Threads</a></p>
<p>Wes: <a href="https://twitter.com/wesbos">X</a> <a href="https://www.instagram.com/wesbos/">Instagram</a> <a href="https://www.tiktok.com/@wesbos">Tiktok</a> <a href="https://www.linkedin.com/in/wesbos/">LinkedIn</a> <a href="https://www.threads.net/@wesbos">Threads</a></p>
<p>Scott: <a href="https://twitter.com/stolinski">X</a> <a href="https://www.instagram.com/stolinski/">Instagram</a> <a href="https://www.tiktok.com/@stolinski">Tiktok</a> <a href="https://www.linkedin.com/in/stolinski/">LinkedIn</a> <a href="https://www.threads.net/@stolinski">Threads</a></p>
<p>Randy: <a href="https://twitter.com/randyrektor">X</a> <a href="https://www.instagram.com/randyrektor/">Instagram</a> <a href="https://www.youtube.com/@randyrektor">YouTube</a> <a href="https://www.threads.net/@randyrektor">Threads</a></p>`
	}}
/>
