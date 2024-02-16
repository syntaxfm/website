<script lang="ts">
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import type { Action } from 'svelte/action';
	import { fly } from 'svelte/transition';
	import emo from '$assets/emo.jpg';
	import bboy from '$assets/bboy.jpg';
	import benjamin from '$assets/benjamin.jpg';
	import number1fan from '$assets/kaitlin.jpg';
	import runonlove from '$assets/runonlove.jpg';
	import cj from '$assets/cj.jpg';
	let hosts = {
		wes: {
			name: 'Wes Bos',
			github: 'wesbos',
			twitter: 'wesbos'
		},
		scott: {
			name: 'Scott Tolinski',
			github: 'stolinski',
			twitter: 'stolinski'
		},
		kaitlin: {
			name: 'Kaitlin Bloom',
			github: 'bl0om',
			twitter: 'kaitlinblooom'
		},
		ben: {
			name: 'Ben Vinegar',
			github: 'benvinegar',
			twitter: 'bentlegen'
		},
		randy: {
			name: 'Randy Rektor',
			github: 'randyrektor',
			twitter: 'randyrektor'
		},
		cj: {
			name: 'CJ Reynolds',
			github: 'w3cj',
			twitter: 'coding_garden'
		}
	};

	const lol: Action = function (node) {
		const src = node.getAttribute('src');
		const swapper = node.dataset.lol;
		function swap() {
			const toSwap = node.getAttribute('src') === src ? swapper : src;
			if (!swapper || !toSwap) return;
			node.setAttribute('src', toSwap);
		}
		// the node has been mounted in the DOM
		node.addEventListener('pointerenter', swap);
		node.addEventListener('pointerleave', swap);
		return {
			destroy() {
				node.removeEventListener('pointerenter', swap);
				node.removeEventListener('pointerleave', swap);
			}
		};
	};

	const speed = 169;
	$: since_start = Date.now() - 1499256000000;
	setInterval(() => {
		since_start = Date.now() - 1499256000000;
	}, 500);

	$: digits = since_start.toString().split('');

	export let data;
</script>

<main style:margin-bottom="2rem">
	<div style:margin-bottom="2rem">
		<h1 class="h3 lines">About Syntax</h1>
		<p>Syntax is a Podcast about Web Development.</p>

		<p>
			Started by Wes and Scott in 2017 <span class="time text-xs"
				>(
				{#each Array.from({ length: digits.length }, (_, i) => i) as i}
					<span class="slot">
						{#key `${digits.at(i)}-${i + 1}`}
							<span
								in:fly={{ duration: speed, y: -15, delay: i * 10 }}
								out:fly={{ duration: speed, y: 15, delay: i * 10 }}>{digits.at(i)}</span
							>
						{/key}
					</span>
				{/each} milliseconds ago to be exact)</span
			>, Syntax has published
			{data.count} podcast episodes on full-stack web development, covering JavaScript Server + Client,
			the latest Frameworks, HTML, CSS, databases, deployment environments, and a whole lot more!
		</p>

		<p>You should listen! It's pretty good.</p>
	</div>

	<div class="grid">
		<div class="team-member">
			<img
				use:lol
				src={`https://github.com/${hosts.wes.github}.png`}
				alt={hosts.wes.name}
				class="avatar"
				data-lol={emo}
			/>
			<h2 class="h4">
				<span class="first">Wes</span>
				<span class="last">Bos</span>
			</h2>
			<div class="desc border-on-dark">
				<HostSocialLink host={hosts.wes} />
				<p>
					Wes Bos is co-host of Syntax and a <a href="https://wesbos.com"
						>web development educator</a
					>. Constantly learning, he creates web development courses focused on JavaScript,
					TypeScript, React, CSS, Node.js and whatever else comes his way.
				</p>
			</div>
		</div>

		<div class="team-member" style:--rotate="0.2deg">
			<img
				src={`https://github.com/${hosts.scott.github}.png`}
				alt={hosts.scott.name}
				class="avatar"
				use:lol
				data-lol={bboy}
			/>
			<h2 class="h4">
				<span class="first">Scott</span>
				<span class="last">Tolinski</span>
			</h2>
			<div class="desc border-on-dark">
				<HostSocialLink host={hosts.scott} />
				<p>
					Scott Tolinski is co-host of Syntax and the creator of <a
						href="https://leveluptutorials.com">Level Up Tutorials</a
					>. In his free time Scott is a dedicated Bboy (breakdancer) & enjoys pushing himself
					athletically through dance, working out and snowboarding.
				</p>
			</div>
		</div>
		<div class="team-member">
			<img
				src={`https://github.com/${hosts.kaitlin.github}.png`}
				alt={hosts.kaitlin.name}
				class="avatar"
				data-lol={number1fan}
				use:lol
			/>
			<h2 class="h4">
				<span class="first">Kaitlin</span>
				<span class="last">Bloom</span>
			</h2>
			<div class="desc border-on-dark">
				<HostSocialLink host={hosts.kaitlin} />
				<p>
					Kaitlin Bloom is Syntax's digital marketing manager. She publishes the Syntax Newsletter,
					manages the Syntax social accounts, and generally tries to figure out how Syntax can
					better reach its audience.
				</p>
			</div>
		</div>
		<div class="team-member benjamin" style:--rotate="1deg">
			<img
				use:lol
				src={`https://github.com/${hosts.ben.github}.png`}
				alt={hosts.ben.name}
				class="avatar"
				data-lol={benjamin}
			/>
			<h2 class="h4">
				<span class="first">Ben</span>
				<span class="last">Vinegar</span>
			</h2>
			<div class="desc border-on-dark">
				<HostSocialLink host={hosts.ben} />
				<p>
					Ben Vinegar is Syntax's General Manager. He helps with the business stuff so the team can
					focus on what they do best. As a developer, Ben built early versions of the <a
						href="https://sentry.io">Sentry</a
					>
					UI and JS SDKs, and once co-wrote
					<a href="https://www.amazon.ca/Third-Party-JavaScript-Ben-Vinegar/dp/1617290548"
						>a book on JavaScript</a
					>.
				</p>
			</div>
		</div>
		<div class="team-member" style:--rotate="1deg">
			<img
				use:lol
				src={`https://github.com/${hosts.randy.github}.png`}
				alt={hosts.randy.name}
				class="avatar"
				data-lol={runonlove}
			/>
			<h2 class="h4">
				<span class="first">Randy</span>
				<span class="last">Rektor</span>
			</h2>
			<div class="desc border-on-dark">
				<HostSocialLink host={hosts.randy} />
				<p>
					Randy Rektor is Syntax's producer. He edits the episodes, produces the videos for YouTube, and helps keep Syntax's production gears oiled. He is a musician, <a href="https://www.youtube.com/@randyrektor">YouTuber</a>, and a self-proclaimed ‘massive audio geek’.
				</p>
			</div>
		</div>
		<div class="team-member" style:--rotate="1deg">
			<img
				use:lol
				src={`https://github.com/${hosts.cj.github}.png`}
				alt={hosts.cj.name}
				class="avatar"
				data-lol={cj}
			/>
			<h2 class="h4">
				<span class="first">CJ</span>
				<span class="last">Reynolds</span>
			</h2>
			<div class="desc border-on-dark">
				<HostSocialLink host={hosts.cj} />
				<p>
					CJ is a Senior Creator at Syntax and the host of <a href="https://coding.garden/">Coding Garden</a>.
					In his spare time CJ enjoys skateboarding, playing board games, collecting VHS tapes and hanging out with his dog.
				</p>
			</div>
		</div>
	</div>
</main>

<style lang="postcss">
	img.avatar {
		width: 100%;
		border-radius: 8px;
		aspect-ratio: 1 / 1;
		object-fit: cover;
	}

	.team-member {
		position: relative;
		container: team-member / inline-size;
		.desc {
			margin-top: -15cqw;
			p {
				margin: 0;
			}
		}
		--text-color: var(--white);
		&.benjamin:hover {
			/* Bens photo is too light to see this */
			--text-color: var(--black);
		}
		h2 {
			position: absolute;
			top: 0;
			line-height: 1;
			overflow: visible;
			pointer-events: none;
			color: var(--white);
			span {
				display: block;
			}
			.first {
				color: var(--bg-root);
				font-size: var(--font-size-md);
				letter-spacing: normal;
				background: var(--primary);
				width: max-content;
				padding-inline: 0.5rem;
			}
			.last {
				/* text-shadow: 0 0 5px rgba(0, 0, 0, 0.2); */
				padding-left: 5px;
				font-size: 20cqw;
				background-image: linear-gradient(
					-1.69deg,
					var(--text-color) 0% 45%,
					transparent 45% 49%,
					var(--text-color) 49%
				);
				color: transparent;
				-webkit-background-clip: text;
			}
		}
	}
	.desc {
		color: var(--sheet-fg);
		background: color-mix(in oklab, var(--bg-1), transparent 4%);
		width: 92%;
		border-radius: var(--brad);
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
		margin: 0 auto;
		position: relative;
		padding: var(--default_padding);
		rotate: var(--rotate, -1deg);
		p {
			font-size: var(--font-size-sm);
		}
	}

	.time {
		position: relative;
		display: inline-block;
		span {
			display: inline-block;
		}
		.slot {
			/* border: 1px solid red; */
			display: inline-block;
			/* padding: 2px; */
			position: relative;
			& > span:first-child {
				/* border: 1px solid blue; */
				position: absolute;
				bottom: 0;
				top: 0;
				height: 100%;
			}
			& > span:last-child {
				/* border: 1px solid green; */
				position: relative;
			}
			& > span:nth-child(3n) {
				/* Sometimes for a split second there are 3 spans */
				display: none;
			}
		}
	}
</style>
